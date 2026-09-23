import { and, eq, gte, inArray, sql } from 'drizzle-orm'
import { tallyDelivery } from '@/admin/delivery-math'
import { getRuntimeDb } from '@/db/runtime'
import { contactSubscriptions, contacts, mailEvents, sendRecipients, sends } from '@/db/schema'

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000

export async function loadDeliveryTotals(now = new Date(), accountId?: string) {
  const since = new Date(now.getTime() - WINDOW_MS)
  const { db } = getRuntimeDb()
  const sent = await db
    .select({ email: contacts.email })
    .from(sendRecipients)
    .innerJoin(sends, eq(sends.id, sendRecipients.sendId))
    .innerJoin(contacts, eq(contacts.id, sendRecipients.contactId))
    .where(
      and(
        gte(sendRecipients.sentAt, since),
        accountId ? eq(sends.accountId, accountId) : undefined,
      ),
    )
  const events = await db
    .select({ email: mailEvents.email, kind: mailEvents.kind })
    .from(mailEvents)
    .where(
      and(
        gte(mailEvents.createdAt, since),
        inArray(mailEvents.kind, ['hard_bounce', 'spam_complaint']),
      ),
    )
  const [unsub] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contactSubscriptions)
    .innerJoin(contacts, eq(contacts.id, contactSubscriptions.contactId))
    .where(
      and(
        gte(contactSubscriptions.unsubscribedAt, since),
        accountId ? eq(contacts.accountId, accountId) : undefined,
      ),
    )
  return tallyDelivery(sent, events, unsub?.count ?? 0)
}
