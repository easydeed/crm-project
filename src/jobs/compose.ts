import { recipientFingerprint } from '@/jobs/recipient-fingerprint'
import { and, eq, inArray, isNull, sql } from 'drizzle-orm'
import { getRuntimeDb, withTransactionDb } from '@/db/runtime'
import { contactSubscriptions, sends, sendRecipients } from '@/db/schema'
import { liveContacts } from '@/db/live-contacts'
import { buildDigestInput } from '@/digest/build-input'
import { renderDigest } from '@/digest/render'
import { NO_EMAIL_REASON, NOTHING_NEW_REASON, UNMATCHED_REASON } from '@/digest/skip-copy'
import type { JobHandler } from '@/jobs/types'
import { emailHash } from '@/suppression/hash'
import { SUPPRESSED_REASON, suppressedHashes } from '@/suppression/suppressions'
import { applyUnsubscribeLinks, unsubscribeUrl } from '@/unsubscribe/links'

type Skip = { contactId: string; reason: string }

const composeInTransaction: JobHandler = async (payload, ctx) => {
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
  if (send.state !== 'scheduled') return
  const targets = Array.isArray(payload.contactIds) ? payload.contactIds.map(String) : null
  if (targets && !targets.length) throw new Error('Targeted composition requires recipients')

  const people = await db
    .select({ id: liveContacts.id, email: liveContacts.email, name: liveContacts.name, addressRaw: liveContacts.addressRaw, parcelId: liveContacts.parcelId, closeDate: liveContacts.closeDate, status: liveContacts.status })
    .from(liveContacts)
    .innerJoin(
      contactSubscriptions,
      and(
        eq(contactSubscriptions.contactId, liveContacts.id),
        eq(contactSubscriptions.scope, 'monthly'),
        isNull(contactSubscriptions.unsubscribedAt),
      ),
    )
    .where(
      and(
        eq(liveContacts.accountId, accountId),
        eq(liveContacts.status, 'matched'),
        targets ? inArray(liveContacts.id, targets) : undefined,
        sql`${liveContacts.parcelId} is not null`,
      ),
    )

  const skips: Skip[] = targets ? (send.skips ?? []).filter((skip) => !targets.includes(skip.contactId)) : []
  const emails = people.flatMap((person) => (person.email ? [person.email] : []))
  const suppressed = await suppressedHashes(db, emails, 'monthly')
  for (const person of people) {
    // Recorded, so /admin/sends shows why: an MLS closing arrives with no email.
    if (!person.email) {
      skips.push({ contactId: person.id, reason: NO_EMAIL_REASON })
      continue
    }
    if (suppressed.has(emailHash(person.email))) {
      skips.push({ contactId: person.id, reason: SUPPRESSED_REASON })
      continue
    }
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
        composedFingerprint: recipientFingerprint(person),
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
    .where(and(eq(sends.id, sendId), eq(sends.accountId, accountId), eq(sends.state, 'scheduled')))
}

// Composition is atomic and serialized across workers. No partial batch can be
// exposed as ready while another composer is still adding recipients.
export const composeSend: JobHandler = async (payload, ctx) => {
  const sendId = String(payload.sendId ?? '')
  if (!sendId) throw new Error('compose requires accountId and sendId')
  const { db } = getRuntimeDb()
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${sendId}))`)
    await withTransactionDb(tx as unknown as typeof db, () => composeInTransaction(payload, ctx))
  })
}
