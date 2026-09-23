import { and, eq, isNull } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import {
  accounts,
  contactSubscriptions,
  contacts,
  sendRecipients,
  sends,
} from '@/db/schema'
import { deliverRecipient, isPermanentDeliveryError } from '@/jobs/deliver'
import { mapLimit } from '@/jobs/pool'
import type { JobHandler } from '@/jobs/types'
import { getMailer } from '@/mail/current'
import { monthlyFromAddress, sendIdempotencyKey } from '@/mail/types'
import { listUnsubscribeHeaders } from '@/unsubscribe/links'

const SEND_CONCURRENCY = 4

export const sendMail: JobHandler = async (payload, ctx) => {
  const sendId = String(payload.sendId ?? '')
  if (!sendId) throw new Error('send requires sendId')

  const { db } = getRuntimeDb()
  const [send] = await db.select().from(sends).where(eq(sends.id, sendId)).limit(1)
  if (!send) throw new Error('Send not found')
  if (send.state === 'skipped' || send.state === 'done') return

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
      .select({ email: contacts.email })
      .from(contacts)
      .where(and(eq(contacts.id, row.contactId), eq(contacts.accountId, account.id)))
      .limit(1)
    if (!contact) {
      await db
        .update(sendRecipients)
        .set({ error: 'Contact not found', permanentFailure: true })
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

    try {
      const { providerId } = await deliverRecipient(
        getMailer(),
        {
          recipientEmail: contact.email,
          unsubscribed: Boolean(sub?.unsubscribedAt),
          accountPaused: account.paused,
        },
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
      const permanent = isPermanentDeliveryError(err)
      await db
        .update(sendRecipients)
        .set({ error: message, permanentFailure: permanent })
        .where(eq(sendRecipients.id, row.id))
      if (!permanent) retryable += 1
    }
  })

  if (retryable === 0) {
    await db.update(sends).set({ state: 'done' }).where(eq(sends.id, sendId))
    return
  }
  throw new Error(`Send incomplete: ${retryable} recipient(s) still unsent`)
}
