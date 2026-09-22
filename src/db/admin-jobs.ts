import { desc } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { jobs } from '@/db/schema'
import { MAX_ATTEMPTS } from '@/jobs/backoff'

export type AdminJobRow = {
  id: string
  kind: string
  state: string
  attempts: number
  error: string | null
  runAfter: Date
  lockedAt: Date | null
  completedAt: Date | null
}

function jobState(row: {
  attempts: number
  lockedAt: Date | null
  completedAt: Date | null
  error: string | null
}): string {
  if (row.completedAt) return 'completed'
  if (row.attempts >= MAX_ATTEMPTS) return 'dead'
  if (row.lockedAt) return 'running'
  if (row.error) return 'retrying'
  return 'queued'
}

/** Read-only recent jobs. Payload is omitted so contact data cannot leak. */
export async function listRecentJobsForAdmin(limit = 50): Promise<AdminJobRow[]> {
  const { db } = getRuntimeDb()
  const rows = await db
    .select({
      id: jobs.id,
      kind: jobs.kind,
      attempts: jobs.attempts,
      error: jobs.error,
      runAfter: jobs.runAfter,
      lockedAt: jobs.lockedAt,
      completedAt: jobs.completedAt,
    })
    .from(jobs)
    .orderBy(desc(jobs.runAfter))
    .limit(limit)

  return rows.map((row) => ({
    ...row,
    state: jobState(row),
  }))
}
