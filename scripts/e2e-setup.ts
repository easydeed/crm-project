/**
 * Prepares a scratch database for the browser tests: a known password for the seeded
 * agent, an active plan, this month's call list, and the ids the specs visit.
 *
 * It sets a password, so it refuses any database that is not on this machine. The check
 * is on the host in DATABASE_URL, not on a flag anyone could set.
 */
import { writeFileSync } from 'node:fs'
import { and, asc, eq, ilike, not } from 'drizzle-orm'
import { isLocalDatabaseUrl } from '../src/config/database-url'

const url = process.env.DATABASE_URL
if (!isLocalDatabaseUrl(url)) {
  console.error('e2e-setup refuses to run: DATABASE_URL is not a database on this machine.')
  process.exit(1)
}
process.env.ONRECORD_E2E = '1'

export const E2E_EMAIL = 'dana@coastline.example'
export const E2E_PASSWORD = 'e2e-local-scratch-only'

async function main() {
  const { hashPassword } = await import('../src/auth/password')
  const { getRuntimeDb, resetRuntimeDb } = await import('../src/db/runtime')
  const { accounts, contacts, subscriptions } = await import('../src/db/schema')
  const { AGENT_ID } = await import('../src/db/fixtures/la-verne')
  const { buildCallLists } = await import('../src/jobs/build-call-lists')
  const { signUnsubscribeToken } = await import('../src/unsubscribe/token')

  const { db } = getRuntimeDb()
  await db.update(accounts).set({ passwordHash: await hashPassword(E2E_PASSWORD) }).where(eq(accounts.id, AGENT_ID))
  await db
    .insert(subscriptions)
    .values({ accountId: AGENT_ID, stripeCustomerId: 'cus_e2e', stripeSubId: 'sub_e2e', plan: 'base', status: 'active', currentPeriodEnd: new Date('2099-01-01') })
    .onConflictDoNothing()
  const now = new Date()

  // A second agent whose people have nothing recent, for the quiet dashboard (OR-043). Its three
  // people are copies of Dana's, on parcels away from Oakdale, so no event reaches them.
  const { quietAgent, quietContactId, QUIET_AGENT_ID } = await import('../src/db/fixtures/e2e-live')
  await db.insert(accounts).values({ ...quietAgent, passwordHash: await hashPassword(E2E_PASSWORD) }).onConflictDoNothing()
  await db
    .insert(subscriptions)
    .values({ accountId: QUIET_AGENT_ID, stripeCustomerId: 'cus_e2e_quiet', stripeSubId: 'sub_e2e_quiet', plan: 'base', status: 'active', currentPeriodEnd: new Date('2099-01-01') })
    .onConflictDoNothing()
  const away = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.accountId, AGENT_ID), eq(contacts.status, 'matched'), not(ilike(contacts.addressRaw, '%Oakdale%'))))
    .orderBy(asc(contacts.name))
    .limit(3)
  for (const [index, row] of away.entries()) {
    const { id: _id, createdAt: _created, updatedAt: _updated, ...copy } = row as typeof row & { createdAt?: unknown; updatedAt?: unknown }
    await db.insert(contacts).values({ ...copy, id: quietContactId(index), accountId: QUIET_AGENT_ID }).onConflictDoNothing()
  }

  for (const accountId of [AGENT_ID, QUIET_AGENT_ID]) {
    await buildCallLists({ accountId, asOf: now.toISOString() }, { jobId: 'e2e', attempt: 1, now })
  }

  const [person] = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.accountId, AGENT_ID), eq(contacts.status, 'matched')))
    // The same person every run, so the desktop screenshots compare like for like.
    .orderBy(asc(contacts.name), asc(contacts.email))
    .limit(1)
  if (!person) throw new Error('The seed has no matched person')
  const state = {
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
    quietEmail: quietAgent.email,
    personId: person.id,
    unsubscribeToken: signUnsubscribeToken(person.id, 'monthly'),
  }
  writeFileSync('e2e/.state.json', JSON.stringify(state, null, 2))
  console.log(`e2e setup ready: person ${person.id}`)
  await resetRuntimeDb()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
