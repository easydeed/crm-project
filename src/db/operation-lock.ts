import { sql } from 'drizzle-orm'
import { createDb, createRuntimeDb } from '@/db/client'
import { isLocalE2E } from '@/config/e2e'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'

// A bounded reusable lock pool, through the transaction pooler in runtime.
// Work uses the separate, reused runtime pool: delivery claims/config commits must
// survive a later provider failure. No runtime access to the migration/session URL.
const queues = new Map<string, (() => void)[]>()
async function acquire(key: string) {
  const waiters = queues.get(key)
  if (!waiters) { queues.set(key, []); return }
  await new Promise<void>((resolve, reject) => {
    const grant = () => { clearTimeout(timer); resolve() }
    const timer = setTimeout(() => {
      waiters.splice(waiters.indexOf(grant), 1)
      reject(new Error('Operation lock is busy. Try again.'))
    }, 5_000)
    waiters.push(grant)
  })
}

let pool: ReturnType<typeof createRuntimeDb> | undefined
function lockPool() {
  if (!pool) {
    const local = process.env.VITEST || isLocalE2E() ? tryLoadIntegrationDatabaseUrl() : null
    pool = local ? createDb(local, 10) : createRuntimeDb(10)
  }
  return pool
}

export async function withOperationLock<T>(key: string, work: () => Promise<T>) {
  await acquire(key)
  try { return await lockPool().db.transaction(async (tx) => {
    await tx.execute(sql`set local lock_timeout = '5s'`)
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${key}))`)
    return work()
  }) } finally {
    const next = queues.get(key)!.shift()
    if (next) next()
    else queues.delete(key)
  }
}
