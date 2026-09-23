import { and, eq } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { jobs } from '@/db/schema'
import { payloadKeyFrom } from '@/jobs/payload-key'
import type { JobKind } from '@/jobs/types'

export type EnqueueResult = { id: string; created: boolean }

export async function enqueue(
  kind: JobKind,
  payload: Record<string, unknown>,
  runAfter: Date,
): Promise<EnqueueResult> {
  const { db } = getRuntimeDb()
  const payloadKey = payloadKeyFrom(payload)
  const inserted = await db
    .insert(jobs)
    .values({
      kind,
      payload,
      payloadKey,
      runAfter,
    })
    .onConflictDoNothing({
      target: [jobs.kind, jobs.payloadKey, jobs.runAfter],
    })
    .returning({ id: jobs.id })

  if (inserted[0]) {
    return { id: inserted[0].id, created: true }
  }

  const existing = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(
      and(
        eq(jobs.kind, kind),
        eq(jobs.payloadKey, payloadKey),
        eq(jobs.runAfter, runAfter),
      ),
    )
    .limit(1)

  if (!existing[0]) {
    throw new Error('enqueue conflict but no existing row found')
  }
  return { id: existing[0].id, created: false }
}
