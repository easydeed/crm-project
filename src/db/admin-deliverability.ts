import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm'
import { getAccountById } from '@/db/accounts'
import { loadDeliveryTotals } from '@/db/delivery-window'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, adminActions, contactSubscriptions, contacts, mailEvents } from '@/db/schema'
import { ADMIN_UNPAUSE, COMPLAINT_PAUSE } from '@/db/system-pause'

export type SuppressionRow = {
  email: string
  reason: string
  at: Date
}

export async function loadDeliverabilityForAdmin(adminAccountId: string, now = new Date()) {
  const admin = await getAccountById(adminAccountId)
  if (!admin || admin.role !== 'admin') return null
  const totals = await loadDeliveryTotals(now)
  const suppressed = await listSuppressions()
  const paused = await listSystemPaused()
  return { totals, suppressed, paused }
}

async function listSuppressions(): Promise<SuppressionRow[]> {
  const { db } = getRuntimeDb()
  const events = await db
    .select({
      email: mailEvents.email,
      kind: mailEvents.kind,
      at: mailEvents.createdAt,
    })
    .from(mailEvents)
    .where(inArray(mailEvents.kind, ['hard_bounce', 'spam_complaint']))
    .orderBy(desc(mailEvents.createdAt))
  const subs = await db
    .select({
      email: contacts.email,
      at: contactSubscriptions.unsubscribedAt,
    })
    .from(contactSubscriptions)
    .innerJoin(contacts, eq(contacts.id, contactSubscriptions.contactId))
    .where(
      and(
        isNotNull(contactSubscriptions.unsubscribedAt),
        inArray(contactSubscriptions.scope, ['monthly', 'weekly']),
      ),
    )

  const byEmail = new Map<string, SuppressionRow>()
  for (const event of events) {
    const email = event.email?.trim().toLowerCase()
    if (!email || byEmail.has(email)) continue
    byEmail.set(email, {
      email,
      reason: event.kind === 'spam_complaint' ? 'Spam complaint' : 'Hard bounce',
      at: event.at,
    })
  }
  for (const sub of subs) {
    const email = sub.email.trim().toLowerCase()
    if (!sub.at || byEmail.has(email)) continue
    byEmail.set(email, { email, reason: 'Unsubscribed', at: sub.at })
  }
  return [...byEmail.values()].sort((left, right) => right.at.getTime() - left.at.getTime())
}

async function listSystemPaused() {
  const { db } = getRuntimeDb()
  const paused = await db
    .select({ id: accounts.id, name: accounts.name })
    .from(accounts)
    .where(eq(accounts.paused, true))
  if (!paused.length) return []
  const actions = await db
    .select({
      targetAccountId: adminActions.targetAccountId,
      action: adminActions.action,
      createdAt: adminActions.createdAt,
    })
    .from(adminActions)
    .where(
      inArray(
        adminActions.targetAccountId,
        paused.map((row) => row.id),
      ),
    )
    .orderBy(desc(adminActions.createdAt))
  return paused.filter((account) => {
    const latest = actions.find(
      (action) =>
        action.targetAccountId === account.id &&
        (action.action === COMPLAINT_PAUSE || action.action === ADMIN_UNPAUSE),
    )
    return latest?.action === COMPLAINT_PAUSE
  })
}
