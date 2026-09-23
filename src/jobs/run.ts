import { eq } from 'drizzle-orm'
import type { Sql } from 'postgres'
import { getRuntimeDb } from '@/db/runtime'
import { jobs } from '@/db/schema'
import { ABANDONED_LOCK_MS, MAX_ATTEMPTS, retryDelayMs } from '@/jobs/backoff'
import { getHandler } from '@/jobs/registry'

export type ClaimedJob = {
  id: string
  kind: string
  payload: Record<string, unknown>
  attempts: number
  runAfter: Date
  lockedAt: Date | null
  completedAt: Date | null
  error: string | null
  payloadKey: string
}

type DbHandle = ReturnType<typeof getRuntimeDb>

function asJob(row: Record<string, unknown>): ClaimedJob {
  return {
    id: String(row.id),
    kind: String(row.kind),
    payload: (row.payload as Record<string, unknown>) ?? {},
    attempts: Number(row.attempts),
    runAfter: new Date(String(row.run_after)),
    lockedAt: row.locked_at ? new Date(String(row.locked_at)) : null,
    completedAt: row.completed_at ? new Date(String(row.completed_at)) : null,
    error: row.error == null ? null : String(row.error),
    payloadKey: String(row.payload_key),
  }
}

/** Claim one due job with SKIP LOCKED. Abandoned locks (>15m) are reclaimable. */
export async function claimNextJob(
  client: Sql,
  now = new Date(),
): Promise<ClaimedJob | null> {
  const abandonedBefore = new Date(now.getTime() - ABANDONED_LOCK_MS)
  const nowIso = now.toISOString()
  const abandonedIso = abandonedBefore.toISOString()
  const rows = await client`
    UPDATE jobs
    SET locked_at = ${nowIso}::timestamptz, attempts = attempts + 1
    WHERE id = (
      SELECT id FROM jobs
      WHERE completed_at IS NULL
        AND attempts < ${MAX_ATTEMPTS}
        AND run_after <= ${nowIso}::timestamptz
        AND (locked_at IS NULL OR locked_at < ${abandonedIso}::timestamptz)
      ORDER BY run_after ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *
  `
  const row = rows[0] as Record<string, unknown> | undefined
  return row ? asJob(row) : null
}

async function markComplete(db: DbHandle['db'], jobId: string, now: Date) {
  await db
    .update(jobs)
    .set({ completedAt: now, error: null, lockedAt: null })
    .where(eq(jobs.id, jobId))
}

async function markFailure(
  db: DbHandle['db'],
  job: ClaimedJob,
  message: string,
  now: Date,
) {
  const delay = retryDelayMs(job.attempts)
  if (delay == null) {
    await db
      .update(jobs)
      .set({ error: message, lockedAt: null })
      .where(eq(jobs.id, job.id))
    return
  }
  await db
    .update(jobs)
    .set({
      error: message,
      lockedAt: null,
      runAfter: new Date(now.getTime() + delay),
    })
    .where(eq(jobs.id, job.id))
}

export async function processClaimedJob(
  claimed: ClaimedJob,
  now = new Date(),
): Promise<void> {
  const handle = getRuntimeDb()
  const handler = getHandler(claimed.kind)
  if (!handler) {
    await markFailure(handle.db, claimed, `Unknown job kind: ${claimed.kind}`, now)
    return
  }

  try {
    await handler(claimed.payload, {
      jobId: claimed.id,
      attempt: claimed.attempts,
      now,
    })
    await markComplete(handle.db, claimed.id, now)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await markFailure(handle.db, claimed, message, now)
  }
}

/** Claim and run one due job. Returns whether a job ran. */
export async function runOneJob(now = new Date()): Promise<boolean> {
  const handle = getRuntimeDb()
  const claimed = await claimNextJob(handle.client, now)
  if (!claimed) return false
  await processClaimedJob(claimed, now)
  return true
}

/** Claim and run up to `limit` due jobs. Returns how many ran. */
export async function runDueJobs(limit: number, now = new Date()): Promise<number> {
  let ran = 0
  for (let i = 0; i < limit; i += 1) {
    const did = await runOneJob(now)
    if (!did) break
    ran += 1
  }
  return ran
}
