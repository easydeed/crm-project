import { AsyncLocalStorage } from 'node:async_hooks'
import { createDb, createRuntimeDb } from './client'
import { isLocalE2E } from '../config/e2e'
import { tryLoadIntegrationDatabaseUrl } from './integration-session'

type RuntimeDb = ReturnType<typeof createRuntimeDb>

const globalForDb = globalThis as { __onrecordRuntimeDb?: RuntimeDb }
const transactionContext = new AsyncLocalStorage<RuntimeDb>()

/** Nested service calls share the transaction without changing another request's DB. */
export function withTransactionDb<T>(db: RuntimeDb['db'], work: () => Promise<T>) {
  return transactionContext.run({ ...getRuntimeDb(), db }, work)
}

function createTestSessionDb() {
  const url = tryLoadIntegrationDatabaseUrl()
  if (!url) {
    throw new Error('Integration tests must use DATABASE_URL on port 5432.')
  }
  return createDb(url)
}

export function getRuntimeDb() {
  const scoped = transactionContext.getStore()
  if (scoped) return scoped
  if (!globalForDb.__onrecordRuntimeDb) {
    globalForDb.__onrecordRuntimeDb = process.env.VITEST || isLocalE2E()
      ? createTestSessionDb()
      : createRuntimeDb()
  }
  return globalForDb.__onrecordRuntimeDb
}

/**
 * A script that owns its connection hands it to the loaders here (OR-050: demo-seed reads the demo
 * project through its session URL, not the app's pooler).
 */
export function setRuntimeDb(handle: RuntimeDb) {
  globalForDb.__onrecordRuntimeDb = handle
}

export async function resetRuntimeDb() {
  const current = globalForDb.__onrecordRuntimeDb
  globalForDb.__onrecordRuntimeDb = undefined
  if (current) await current.client.end({ timeout: 2 })
}
