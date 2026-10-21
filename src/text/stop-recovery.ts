import { and, eq, isNull, sql } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { jobs } from '@/db/schema'
import { enqueue } from '@/jobs/enqueue'
import { switchAddonOff } from '@/addons/state'
import { TEXT_CALL_LIST_KEY } from '@/addons/text-call-list'
import type { JobHandler } from '@/jobs/types'

export class TextBillingFailure extends Error {}

/** Persist before attempting switch-off; cron retries independently of Twilio. */
export async function queueStopRecovery(accountId: string) {
  const { db } = getRuntimeDb()
  const [pending] = await db.select().from(jobs).where(and(eq(jobs.kind, 'stop_texting'), isNull(jobs.completedAt), sql`${jobs.payload}->>'accountId' = ${accountId}`)).limit(1)
  if (pending) return pending.id
  return (await enqueue('stop_texting', { accountId }, new Date())).id
}

export async function finishStopRecovery(accountId: string) {
  await getRuntimeDb().db.update(jobs).set({ completedAt: new Date(), error: null }).where(and(eq(jobs.kind, 'stop_texting'), isNull(jobs.completedAt), sql`${jobs.payload}->>'accountId' = ${accountId}`))
}

export const retryStopTexting: JobHandler = async (payload) => {
  const accountId = String(payload.accountId)
  const result = await switchAddonOff(accountId, TEXT_CALL_LIST_KEY)
  if (!result.ok) throw new TextBillingFailure(result.message)
  await finishStopRecovery(accountId)
}
