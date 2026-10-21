import { and, eq, isNull, or, sql } from 'drizzle-orm'
import { getAccountById } from '@/db/accounts'
import { getRuntimeDb } from '@/db/runtime'
import { adminActions, sendRecipients, sends } from '@/db/schema'
import { enqueue } from '@/jobs/enqueue'

/** Rebuild only content that is known never to have reached a provider. */
export async function recomposeUnsentSend(adminAccountId: string, sendId: string, now = new Date()) {
  const admin = await getAccountById(adminAccountId)
  if (admin?.role !== 'admin') return false
  const { db } = getRuntimeDb()
  const [send] = await db.select().from(sends).where(eq(sends.id, sendId)).limit(1)
  if (!send || send.state === 'skipped') return false
  await db.transaction(async (tx) => {
    await tx.delete(sendRecipients).where(and(
      eq(sendRecipients.sendId, sendId), isNull(sendRecipients.sentAt), isNull(sendRecipients.deliveryClaimedAt),
      or(isNull(sendRecipients.composedFingerprint), sql`${sendRecipients.error} like 'Person or house changed after composition.%'`),
    ))
    await tx.update(sends).set({ state: 'scheduled' }).where(eq(sends.id, sendId))
    await tx.insert(adminActions).values({ adminAccountId, targetAccountId: send.accountId, action: 'recompose_unsent', detail: { sendId } })
  })
  await enqueue('compose', { accountId: send.accountId, sendId }, now)
  await enqueue('send', { sendId }, now)
  return true
}
