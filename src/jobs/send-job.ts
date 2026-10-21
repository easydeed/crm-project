import { recipientFingerprint } from '@/jobs/recipient-fingerprint'
import { withOperationLock } from '@/db/operation-lock'
import { assertSendAllowed } from '@/jobs/send-guard'
import { definitelyRejected } from '@/mail/delivery-error'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, contactSubscriptions, sendRecipients, sends } from '@/db/schema'
import { liveContacts } from '@/db/live-contacts'
import { deliverRecipient, isPermanentDeliveryError } from '@/jobs/deliver'
import { loadBillingState } from '@/billing/load-state'
import { billingAllowsSending } from '@/billing/status'
import { maybePauseForComplaints } from '@/jobs/complaint-pause'
import { isSuppressed } from '@/suppression/suppressions'
import { NO_EMAIL_REASON } from '@/digest/skip-copy'
import { mapLimit } from '@/jobs/pool'
import type { JobHandler } from '@/jobs/types'
import { getMailer } from '@/mail/current'
import { monthlyFromAddress, sendIdempotencyKey } from '@/mail/types'
import { listUnsubscribeHeaders } from '@/unsubscribe/links'

const SEND_CONCURRENCY = 4

const sendMailInLock: JobHandler = async (payload, ctx) => {
  const sendId = String(payload.sendId ?? '')
  if (!sendId) throw new Error('send requires sendId')

  const { db } = getRuntimeDb()
  const [send] = await db.select().from(sends).where(eq(sends.id, sendId)).limit(1)
  if (!send) throw new Error('Send not found')
  if (send.state === 'skipped' || send.state === 'done') return
  if (send.state !== 'ready') throw new Error('Send is waiting for composition')
  await maybePauseForComplaints(send.accountId, ctx.now)

  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, send.accountId))
    .limit(1)
  if (!account) throw new Error('Account not found')

  const from = monthlyFromAddress(account.senderName)
  const replyTo = account.replyTo?.trim() || account.email
  const pending = await db
    .select()
    .from(sendRecipients)
    .where(
      and(
        eq(sendRecipients.sendId, sendId),
        isNull(sendRecipients.sentAt),
        eq(sendRecipients.permanentFailure, false),
      ),
    )

  let retryable = 0
  await mapLimit(pending, SEND_CONCURRENCY, async (row) => {
    const [contact] = await db
      .select({ email: liveContacts.email, name: liveContacts.name, addressRaw: liveContacts.addressRaw, parcelId: liveContacts.parcelId, closeDate: liveContacts.closeDate, status: liveContacts.status })
      .from(liveContacts)
      .where(and(eq(liveContacts.id, row.contactId), eq(liveContacts.accountId, account.id)))
      .limit(1)
    if (!contact) {
      await db
        .update(sendRecipients)
        .set({ error: 'Contact not found', permanentFailure: true })
        .where(eq(sendRecipients.id, row.id))
      return
    }
    // The email was removed after compose. Permanent: retrying cannot fix it.
    if (!contact.email) {
      await db
        .update(sendRecipients)
        .set({ error: NO_EMAIL_REASON, permanentFailure: true })
        .where(eq(sendRecipients.id, row.id))
      return
    }
    const [sub] = await db
      .select({ unsubscribedAt: contactSubscriptions.unsubscribedAt })
      .from(contactSubscriptions)
      .where(
        and(
          eq(contactSubscriptions.contactId, row.contactId),
          eq(contactSubscriptions.scope, 'monthly'),
        ),
      )
      .limit(1)

    let claimed = false
    try {
      const [freshAccount] = await db.select({ paused: accounts.paused }).from(accounts).where(eq(accounts.id, account.id)).limit(1)
      const billing = await loadBillingState(db, account.id)
      const guard = {
        recipientEmail: contact.email,
        unsubscribed: !sub || Boolean(sub.unsubscribedAt),
        suppressed: await isSuppressed(db, contact.email, 'monthly'),
        accountPaused: !freshAccount || freshAccount.paused,
        billingActive: billingAllowsSending(billing, ctx.now),
      }
      assertSendAllowed(guard)
      if (!row.composedFingerprint || row.composedFingerprint !== recipientFingerprint(contact)) {
        await db.update(sendRecipients).set({ error: row.error ? `${row.error} Person or house also changed after composition.` : 'Person or house changed after composition. Review before sending.', permanentFailure: true }).where(eq(sendRecipients.id, row.id))
        return
      }
      if (row.deliveryClaimedAt) {
        if (ctx.now.getTime() - row.deliveryClaimedAt.getTime() < 15 * 60_000) { retryable += 1; return }
        await db.update(sendRecipients).set({ error: 'Delivery outcome unknown. Reconcile with the provider before retrying.', permanentFailure: true }).where(eq(sendRecipients.id, row.id))
        return
      }

      const acquired = await db.update(sendRecipients).set({ deliveryClaimedAt: ctx.now })
        .where(and(eq(sendRecipients.id, row.id), isNull(sendRecipients.deliveryClaimedAt), isNull(sendRecipients.sentAt), sql`exists (select 1 from ${sends} where ${sends.id} = ${sendId} and ${sends.state} = 'ready')`))
        .returning({ id: sendRecipients.id })
      if (!acquired.length) { retryable += 1; return }
      claimed = true
      const { providerId } = await deliverRecipient(
        getMailer(), guard,
        {
          to: contact.email,
          from,
          replyTo,
          subject: row.subject ?? '',
          html: row.html ?? '',
          text: row.plainText ?? '',
          stream: 'monthly',
          idempotencyKey: sendIdempotencyKey(sendId, row.contactId),
          headers: listUnsubscribeHeaders(row.contactId, 'monthly'),
        },
      )
      await db
        .update(sendRecipients)
        .set({ sentAt: ctx.now, providerId, error: null })
        .where(and(eq(sendRecipients.id, row.id), isNull(sendRecipients.sentAt)))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const uncertain = claimed && !definitelyRejected(err)
      const permanent = uncertain || isPermanentDeliveryError(err)
      await db
        .update(sendRecipients)
        .set({ error: uncertain ? `Delivery outcome unknown. Reconcile before retrying: ${message}` : message, permanentFailure: permanent, ...(claimed && !uncertain ? { deliveryClaimedAt: null } : {}) })
        .where(eq(sendRecipients.id, row.id))
      if (!permanent) retryable += 1
    }
  })

  if (retryable === 0) {
    await db.update(sends).set({ state: 'done' }).where(and(eq(sends.id, sendId), eq(sends.state, 'ready')))
    await maybePauseForComplaints(send.accountId, ctx.now)
    return
  }
  throw new Error(`Send incomplete: ${retryable} recipient(s) still unsent`)
}

export const sendMail: JobHandler = (payload, ctx) => withOperationLock(`delivery:${String(payload.sendId ?? '')}`, () => sendMailInLock(payload, ctx))
