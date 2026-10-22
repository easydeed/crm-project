import { sql } from 'drizzle-orm'
import { describe, expect, test } from 'vitest'
import { createDb } from '@/db/client'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { withOperationLock } from '@/db/operation-lock'

const url = tryLoadIntegrationDatabaseUrl()
describe.skipIf(!url)('pooler transaction locks', () => {
  test('a thrown operation releases its transaction-scoped lock', async () => {
    const key = 'round-two-release'
    await expect(withOperationLock(key, async () => { throw new Error('operation failed') })).rejects.toThrow('operation failed')
    const other = createDb(url!)
    try {
      const [row] = await other.db.execute(sql`select pg_try_advisory_xact_lock(hashtext(${key})) as acquired`)
      expect(row.acquired).toBe(true)
    } finally { await other.client.end({ timeout: 2 }) }
  })
  test('a contended database lock times out without running the operation', async () => {
    const key = 'round-two-timeout', other = createDb(url!)
    let release!: () => void, acquired!: () => void
    const ready = new Promise<void>((resolve) => { acquired = resolve })
    const hold = new Promise<void>((resolve) => { release = resolve })
    const owner = other.db.transaction(async (tx) => { await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${key}))`); acquired(); await hold })
    await ready
    const timer = setTimeout(release, 6_500)
    let ran = false, error: unknown
    try { await withOperationLock(key, async () => { ran = true }) } catch (caught) { error = caught }
    finally { clearTimeout(timer); release(); await owner; await other.client.end({ timeout: 2 }) }
    expect(ran).toBe(false)
    expect((error as Error & { cause: { code: string } }).cause.code).toBe('55P03')
  })
  test('the same-key local queue has a timeout too', async () => {
    let entered!: () => void, release!: () => void
    const ready = new Promise<void>((resolve) => { entered = resolve })
    const hold = new Promise<void>((resolve) => { release = resolve })
    const owner = withOperationLock('round-two-local-owner', async () => { entered(); await hold })
    await ready
    const timer = setTimeout(release, 6_500)
    let ran = false, error: unknown
    try { await withOperationLock('round-two-local-owner', async () => { ran = true }) } catch (caught) { error = caught }
    finally { clearTimeout(timer); release(); await owner }
    expect(ran).toBe(false)
    expect(String(error)).toMatch(/lock is busy/)
  })
  test('a long send does not block a different account billing key', async () => {
    let entered!: () => void, release!: () => void
    const ready = new Promise<void>((resolve) => { entered = resolve })
    const hold = new Promise<void>((resolve) => { release = resolve })
    const owner = withOperationLock('send:round-three', async () => { entered(); await hold })
    await ready
    const timer = setTimeout(release, 6_500)
    try {
      const started = Date.now()
      expect(await withOperationLock('billing:other-account', async () => 'changed')).toBe('changed')
      expect(Date.now() - started).toBeLessThan(4_000)
    } finally { clearTimeout(timer); release(); await owner }
  })
})
