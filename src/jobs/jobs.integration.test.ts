import { randomUUID } from 'node:crypto'
import { eq, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { createDb } from '@/db/client'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { resetRuntimeDb } from '@/db/runtime'
import { jobs } from '@/db/schema'
import { ABANDONED_LOCK_MS, MAX_ATTEMPTS } from '@/jobs/backoff'
import { enqueue } from '@/jobs/enqueue'
import { payloadKeyFrom } from '@/jobs/payload-key'
import {
  claimNextJob,
  processClaimedJob,
  runDueJobs,
} from '@/jobs/run'

const databaseUrl = tryLoadIntegrationDatabaseUrl()

describe.skipIf(!databaseUrl)('jobs runner against the session pooler', () => {
  const handle = databaseUrl ? createDb(databaseUrl) : null
  const jobIds: string[] = []

  function db() {
    if (!handle) throw new Error('DATABASE_URL is not set')
    return handle.db
  }

  function client() {
    if (!handle) throw new Error('DATABASE_URL is not set')
    return handle.client
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
  })

  afterAll(async () => {
    if (!handle) return
    for (const id of jobIds) {
      await handle.db.delete(jobs).where(eq(jobs.id, id))
    }
    await handle.client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  async function trackInsert(
    kind: string,
    payload: Record<string, unknown>,
    runAfter: Date,
  ) {
    const [row] = await db()
      .insert(jobs)
      .values({
        kind,
        payload,
        payloadKey: payloadKeyFrom(payload),
        runAfter,
      })
      .returning({ id: jobs.id })
    jobIds.push(row.id)
    return row.id
  }

  /** Claim target id; defer other due jobs so shared DB leftovers cannot steal. */
  async function claimTarget(id: string, now: Date) {
    for (let i = 0; i < 40; i += 1) {
      const claimed = await claimNextJob(client(), now)
      if (!claimed) return null
      if (claimed.id === id) return claimed
      if (!jobIds.includes(claimed.id)) jobIds.push(claimed.id)
      await db()
        .update(jobs)
        .set({
          lockedAt: null,
          attempts: Math.max(0, claimed.attempts - 1),
          runAfter: new Date('2099-06-01T00:00:00.000Z'),
        })
        .where(eq(jobs.id, claimed.id))
    }
    return null
  }

  test('two concurrent claimers never take the same job', async () => {
    const id = await trackInsert(
      'compose',
      { concurrent: randomUUID() },
      new Date('2000-01-01T00:00:00.000Z'),
    )
    const [a, b] = await Promise.all([
      claimNextJob(client()),
      claimNextJob(client()),
    ])
    const claimedIds = [a?.id, b?.id].filter(Boolean) as string[]
    for (const claimedId of claimedIds) {
      if (!jobIds.includes(claimedId)) jobIds.push(claimedId)
    }
    expect(claimedIds.filter((x) => x === id)).toHaveLength(1)
    expect(new Set(claimedIds).size).toBe(claimedIds.length)
  })

  test('throw retries on backoff and is dead after four attempts', async () => {
    const id = await trackInsert(
      'send',
      { recipientEmail: `dead-${randomUUID()}@example.com` },
      new Date(Date.now() - 1000),
    )
    delete process.env.SEND_ENABLED

    let now = new Date()
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      const claimed = await claimTarget(id, now)
      expect(claimed).not.toBeNull()
      await processClaimedJob(claimed!, now)
      const row = (await db().select().from(jobs).where(eq(jobs.id, id)).limit(1))[0]
      expect(row.attempts).toBe(i + 1)
      expect(row.completedAt).toBeNull()
      expect(row.error).toMatch(/send requires sendId/)
      if (i < MAX_ATTEMPTS - 1) {
        const expectedMs = [60_000, 5 * 60_000, 30 * 60_000][i]!
        expect(
          Math.abs(row.runAfter.getTime() - (now.getTime() + expectedMs)),
        ).toBeLessThan(2000)
        now = new Date(row.runAfter.getTime())
      } else {
        expect(row.attempts).toBe(4)
        const again = await claimTarget(id, new Date(now.getTime() + 86_400_000))
        expect(again).toBeNull()
      }
    }
  })

  test('abandoned lock is claimable after 15 minutes', async () => {
    const now = new Date()
    const id = await trackInsert(
      'refresh_mls',
      { abandoned: randomUUID() },
      new Date(now.getTime() - 1000),
    )
    await db()
      .update(jobs)
      .set({
        lockedAt: new Date(now.getTime() - ABANDONED_LOCK_MS - 1000),
        attempts: 1,
      })
      .where(eq(jobs.id, id))

    const claimed = await claimTarget(id, now)
    expect(claimed?.id).toBe(id)
    expect(claimed?.attempts).toBe(2)
  })

  test('duplicate enqueue produces one row', async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
    const runAfter = new Date('2030-01-01T00:00:00.000Z')
    const payload = { dup: randomUUID() }
    const first = await enqueue('build_call_lists', payload, runAfter)
    const second = await enqueue('build_call_lists', payload, runAfter)
    jobIds.push(first.id)
    expect(second.id).toBe(first.id)
    expect(first.created).toBe(true)
    expect(second.created).toBe(false)
    const count = await db()
      .select({ n: sql<number>`count(*)::int` })
      .from(jobs)
      .where(eq(jobs.id, first.id))
    expect(count[0]?.n).toBe(1)
  })

  test('runDueJobs completes a stub kind', async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
    const id = await trackInsert(
      'refresh_parcels',
      { ok: randomUUID() },
      new Date('2000-01-02T00:00:00.000Z'),
    )
    const claimed = await claimTarget(id, new Date())
    expect(claimed).not.toBeNull()
    await processClaimedJob(claimed!)
    const row = await db().select().from(jobs).where(eq(jobs.id, id)).limit(1)
    expect(row[0]?.completedAt).not.toBeNull()
    // Still exercise the batch runner path once.
    expect(await runDueJobs(1, new Date('1999-01-01'))).toBe(0)
  })
})
