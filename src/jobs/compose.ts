import { and, eq, isNull, sql } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { contactSubscriptions, contacts, sends, sendRecipients } from '@/db/schema'
import { buildDigestInput } from '@/digest/build-input'
import { renderDigest } from '@/digest/render'
import { NOTHING_NEW_REASON, UNMATCHED_REASON } from '@/digest/skip-copy'
import type { JobHandler } from '@/jobs/types'
import { applyUnsubscribeLinks, unsubscribeUrl } from '@/unsubscribe/links'

type Skip = { contactId: string; reason: string }

export const composeSend: JobHandler = async (payload, ctx) => {
  const accountId = String(payload.accountId ?? '')
  const sendId = String(payload.sendId ?? '')
  if (!accountId || !sendId) throw new Error('compose requires accountId and sendId')

  const { db } = getRuntimeDb()
  const [send] = await db
    .select()
    .from(sends)
    .where(and(eq(sends.id, sendId), eq(sends.accountId, accountId)))
    .limit(1)
  if (!send) throw new Error('Send not found for this account')
  if (send.state === 'skipped' || send.state === 'done') return

  const people = await db
    .select({ id: contacts.id })
    .from(contacts)
    .innerJoin(
      contactSubscriptions,
      and(
        eq(contactSubscriptions.contactId, contacts.id),
        eq(contactSubscriptions.scope, 'monthly'),
        isNull(contactSubscriptions.unsubscribedAt),
      ),
    )
    .where(
      and(
        eq(contacts.accountId, accountId),
        eq(contacts.status, 'matched'),
        sql`${contacts.parcelId} is not null`,
      ),
    )

  const skips: Skip[] = []
  for (const person of people) {
    const input = await buildDigestInput(db, accountId, person.id, ctx.now)
    if (!input) {
      skips.push({ contactId: person.id, reason: UNMATCHED_REASON })
      continue
    }
    const result = renderDigest(input)
    if (!result.send) {
      skips.push({ contactId: person.id, reason: result.reason || NOTHING_NEW_REASON })
      continue
    }
    const linked = applyUnsubscribeLinks(
      result.html,
      result.text,
      unsubscribeUrl(person.id, 'monthly'),
    )
    await db
      .insert(sendRecipients)
      .values({
        sendId,
        contactId: person.id,
        html: linked.html,
        plainText: linked.text,
        subject: result.subject,
      })
      .onConflictDoNothing({
        target: [sendRecipients.sendId, sendRecipients.contactId],
      })
  }

  const [counted] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sendRecipients)
    .where(eq(sendRecipients.sendId, sendId))

  await db
    .update(sends)
    .set({
      state: 'ready',
      composedCount: counted?.count ?? 0,
      skippedCount: skips.length,
      skips,
    })
    .where(and(eq(sends.id, sendId), eq(sends.accountId, accountId)))
}
