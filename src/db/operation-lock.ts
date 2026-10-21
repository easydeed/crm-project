import { sql } from 'drizzle-orm'
import { createDb, createRuntimeDb } from '@/db/client'
import { isLocalE2E } from '@/config/e2e'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'

// One reusable lock connection per process, through the transaction pooler in runtime.
// Work uses the separate, reused runtime pool: delivery claims/config commits must
// survive a later provider failure. No runtime access to the migration/session URL.
let occupied = false
const waiters: (() => void)[] = []
async function acquire() {
  if (!occupied) { occupied = true; return }
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
    pool = local ? createDb(local) : createRuntimeDb()
  }
  return pool
}

export async function withOperationLock<T>(key: string, work: () => Promise<T>) {
  await acquire()
  try { return await lockPool().db.transaction(async (tx) => {
    await tx.execute(sql`set local lock_timeout = '5s'`)
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${key}))`)
    return work()
  }) } finally {
    const next = waiters.shift()
    if (next) next()
    else occupied = false
  }
}
