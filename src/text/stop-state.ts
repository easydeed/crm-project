import { randomUUID } from 'node:crypto'
import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { jobs } from '@/db/schema'
import { enqueue } from '@/jobs/enqueue'
import { MAX_ATTEMPTS } from '@/jobs/backoff'

export async function queueStopRecovery(accountId: string) {
  const { db } = getRuntimeDb()
  const [pending] = await db.select().from(jobs).where(and(eq(jobs.kind, 'stop_texting'), isNull(jobs.completedAt), lt(jobs.attempts, MAX_ATTEMPTS), sql`${jobs.payload}->>'accountId' = ${accountId}`)).limit(1)
  if (pending) return pending.id
  // A fresh request must not collide with an exhausted receipt, even in the same millisecond.
  return (await enqueue('stop_texting', { accountId, requestId: randomUUID() }, new Date())).id
}

export async function finishStopRecovery(accountId: string) {
  await getRuntimeDb().db.update(jobs).set({ completedAt: new Date(), error: null }).where(and(eq(jobs.kind, 'stop_texting'), sql`${jobs.payload}->>'accountId' = ${accountId}`))
}

export async function loadStopRecovery(accountId: string): Promise<'pending' | 'failed' | null> {
  const [pending] = await getRuntimeDb().db.select({ id: jobs.id }).from(jobs).where(and(eq(jobs.kind, 'stop_texting'), isNull(jobs.completedAt), lt(jobs.attempts, MAX_ATTEMPTS), sql`${jobs.payload}->>'accountId' = ${accountId}`)).limit(1)
  if (pending) return 'pending'
  const [latest] = await getRuntimeDb().db.select().from(jobs).where(and(eq(jobs.kind, 'stop_texting'), sql`${jobs.payload}->>'accountId' = ${accountId}`)).orderBy(desc(jobs.enqueuedFor), desc(jobs.id)).limit(1)
  if (!latest) return null
  if (latest.attempts >= MAX_ATTEMPTS && latest.error) return 'failed'
  return latest.completedAt ? null : 'pending'
}
