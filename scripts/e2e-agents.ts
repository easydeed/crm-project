/**
 * Builds the agents in src/db/fixtures/e2e-agents.ts into the scratch database, then checks that
 * each one shows the state it exists for (OR-044a). Imported by e2e-setup, which has already
 * refused any database that is not on this machine.
 */
import { and, asc, count, eq, ilike, inArray, isNull, not } from 'drizzle-orm'
import { hashPassword } from '../src/auth/password'
import { loadHomeSend } from '../src/app/app/home-send'
import { loadBillingView } from '../src/billing/account-billing'
import { agent as seededAgent } from '../src/db/fixtures/la-verne'
import { quietAgent } from '../src/db/fixtures/e2e-live'
import { E2E_AGENTS, E2E_PERIOD_END, agentContactId, stripeIds, type E2EAgent } from '../src/db/fixtures/e2e-agents'
import { getRuntimeDb } from '../src/db/runtime'
import { accountAddons, accounts, adminActions, contacts, contactSubscriptions, groupMembers, groups } from '../src/db/schema'
import { subscriptions } from '../src/db/schema-billing'
import { COMPLAINT_PAUSE } from '../src/db/system-pause'

type Db = ReturnType<typeof getRuntimeDb>['db']

/** A fixed moment for the rows whose time shows nowhere, so reseeds write the same thing. */
const SET_AT = new Date('2026-01-05T17:00:00Z')

const numberOf = (row: E2EAgent) => Number.parseInt(row.id.slice(-12), 16)
const groupId = (row: E2EAgent, index: number) => `00000000-0000-4000-81${numberOf(row).toString(16).padStart(2, '0')}-${(index + 1).toString(16).padStart(12, '0')}`

function withLabel(email: string, label: string) {
  const at = email.indexOf('@')
  return `${email.slice(0, at)}+${label}${email.slice(at)}`
}

async function insertAccount(db: Db, row: E2EAgent, passwordHash: string) {
  const base = row.key === 'quiet' ? quietAgent : { ...seededAgent, brokerage: 'Hillside Homes', dre: null, mlsAgentId: null }
  await db
    .insert(accounts)
    .values({
      ...base,
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.login ? passwordHash : '!e2e-not-a-login',
      role: row.role ?? 'agent',
      phone: row.phone !== undefined ? row.phone : `909-555-01${50 + numberOf(row)}`,
      phoneVerifiedAt: row.phoneVerified ? SET_AT : null,
      sendTime: row.sendTime ?? null,
      paused: row.paused ?? false,
    })
    .onConflictDoNothing()
}

async function copyPeople(db: Db, row: E2EAgent) {
  const people = row.people
  if (!people) return
  const total = people.copies + (people.noEmail ?? 0)
  const pool = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.accountId, seededAgent.id), eq(contacts.status, 'matched'), not(ilike(contacts.addressRaw, '%Oakdale%'))))
    .orderBy(asc(contacts.name))
    .limit(total)
  if (pool.length < total) throw new Error(`The seed has ${pool.length} people to copy for ${row.key}, not ${total}`)
  const n = numberOf(row)
  for (const [index, source] of pool.entries()) {
    const { id: _id, createdAt: _created, updatedAt: _updated, ...copy } = source as typeof source & { createdAt?: unknown; updatedAt?: unknown }
    const email = index >= people.copies ? null : people.ownEmails && copy.email ? withLabel(copy.email, row.key.toLowerCase()) : copy.email
    await db.insert(contacts).values({ ...copy, email, id: agentContactId(n, index), accountId: row.id }).onConflictDoNothing()
  }
  const unsubscribed = Array.from({ length: people.unsubscribed ?? 0 }, (_, index) => agentContactId(n, index))
  if (unsubscribed.length) await db.update(contactSubscriptions).set({ unsubscribedAt: SET_AT }).where(inArray(contactSubscriptions.contactId, unsubscribed))
  for (const [index, group] of (row.groups ?? []).entries()) {
    await db.insert(groups).values({ id: groupId(row, index), accountId: row.id, name: group.name }).onConflictDoNothing()
    for (const member of group.members) {
      await db.insert(groupMembers).values({ groupId: groupId(row, index), contactId: agentContactId(n, member) }).onConflictDoNothing()
    }
  }
}

export async function buildAgents(db: Db, password: string) {
  const passwordHash = await hashPassword(password)
  for (const row of E2E_AGENTS) {
    if (row.insert) await insertAccount(db, row, passwordHash)
    else await db.update(accounts).set({ passwordHash, sendTime: row.sendTime ?? null }).where(eq(accounts.id, row.id))
    if (row.billing.plan === 'stripe') {
      const { sub, customer } = stripeIds(row)
      await db
        .insert(subscriptions)
        .values({ accountId: row.id, stripeCustomerId: customer, stripeSubId: sub, plan: 'base', status: row.billing.status, currentPeriodEnd: E2E_PERIOD_END, cancelAtPeriodEnd: row.billing.cancelAtPeriodEnd ?? false })
        .onConflictDoNothing()
    }
    await copyPeople(db, row)
    for (const addon of row.addons ?? []) {
      await db.insert(accountAddons).values({ accountId: row.id, addonKey: addon.key, enabled: true, config: addon.config, enabledAt: SET_AT }).onConflictDoNothing()
    }
    if (row.complaintPause) {
      await db.insert(adminActions).values({ adminAccountId: null, targetAccountId: row.id, action: COMPLAINT_PAUSE, detail: { source: 'e2e' }, createdAt: SET_AT })
    }
  }
}

async function billingState(accountId: string) {
  try {
    const view = await loadBillingView(accountId)
    if (view.kind !== 'subscribed') return view.kind
    return view.status === 'active' && view.cancelAtPeriodEnd ? 'set-to-end' : view.status
  } catch {
    return 'unreachable'
  }
}

/**
 * Fail here, not quietly in a screenshot (OR-043a's rule, for every agent): each agent is read back
 * through the loaders its screens use, and any that no longer shows its state stops the run.
 */
export async function checkAgents(db: Db, now: Date) {
  const wrong: string[] = []
  for (const row of E2E_AGENTS) {
    const { home, billing, people, phone } = row.expects
    if (home !== undefined) {
      const kind = (await loadHomeSend(row.id, now)).kind
      if (kind !== home) wrong.push(`${row.key}: dashboard is ${kind}, not ${home}`)
    }
    if (billing !== undefined) {
      const state = await billingState(row.id)
      if (state !== billing) wrong.push(`${row.key}: billing is ${state}, not ${billing}`)
    }
    if (people !== undefined) {
      const [found] = await db.select({ n: count() }).from(contacts).where(and(eq(contacts.accountId, row.id), isNull(contacts.deletedAt)))
      if (found.n !== people) wrong.push(`${row.key}: ${found.n} people, not ${people}`)
    }
    if (phone !== undefined) {
      const [account] = await db.select({ phone: accounts.phone, verifiedAt: accounts.phoneVerifiedAt }).from(accounts).where(eq(accounts.id, row.id))
      const state = !account?.phone ? 'none' : account.verifiedAt ? 'verified' : 'unverified'
      if (state !== phone) wrong.push(`${row.key}: phone is ${state}, not ${phone}`)
    }
  }
  if (wrong.length) throw new Error(`The e2e agents no longer show their states:\n- ${wrong.join('\n- ')}`)
}
