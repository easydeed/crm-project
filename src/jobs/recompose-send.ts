import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import { liveContacts } from '@/db/live-contacts'
import { getAccountById } from '@/db/accounts'
import { getRuntimeDb, withTransactionDb } from '@/db/runtime'
import { withOperationLock } from '@/db/operation-lock'
import { adminActions, sendRecipients, sends } from '@/db/schema'
import { enqueue } from '@/jobs/enqueue'
import { composeSend } from '@/jobs/compose'
import { CHANGED_BEFORE_ATTEMPT } from '@/jobs/delivery-hold'

/** Rebuild only fingerprinted content held before its first provider attempt. */
export async function recomposeUnsentSend(adminAccountId: string, sendId: string, now = new Date()) {
  const admin = await getAccountById(adminAccountId)
  if (admin?.role !== 'admin') return false
  return withOperationLock(`delivery:${sendId}`, async () => {
    const { db } = getRuntimeDb()
    return db.transaction(async (tx) => {
      const [send] = await tx.select().from(sends).where(eq(sends.id, sendId)).for('update')
      if (!send || send.state !== 'ready') return false
      const removed = await tx.delete(sendRecipients).where(and(
        eq(sendRecipients.sendId, sendId), isNull(sendRecipients.sentAt), isNull(sendRecipients.providerId),
        isNull(sendRecipients.deliveryClaimedAt), isNotNull(sendRecipients.composedFingerprint),
        eq(sendRecipients.permanentFailure, true),
        // Historical receipts for deleted people stay intact; only live targets rebuild.
        inArray(sendRecipients.contactId, tx.select({ id: liveContacts.id }).from(liveContacts).where(eq(liveContacts.accountId, send.accountId))),
        eq(sendRecipients.error, CHANGED_BEFORE_ATTEMPT),
      )).returning({ contactId: sendRecipients.contactId })
      if (!removed.length) return false
      await tx.update(sends).set({ state: 'scheduled' }).where(eq(sends.id, sendId))
      await withTransactionDb(tx as unknown as typeof db, async () => {
        await composeSend({ accountId: send.accountId, sendId, contactIds: removed.map((row) => row.contactId) }, { now, jobId: 'admin-recompose', attempt: 1 })
        await enqueue('send', { sendId }, now)
      })
      await tx.insert(adminActions).values({ adminAccountId, targetAccountId: send.accountId, action: 'recompose_unsent', detail: { sendId, contactIds: removed.map((row) => row.contactId) } })
      return true
    })
  })
}
