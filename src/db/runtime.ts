import { createDb, createRuntimeDb } from './client'
import { tryLoadIntegrationDatabaseUrl } from './integration-session'

type RuntimeDb = ReturnType<typeof createRuntimeDb>

const globalForDb = globalThis as { __onrecordRuntimeDb?: RuntimeDb }

function createTestSessionDb() {
  const url = tryLoadIntegrationDatabaseUrl()
  if (!url) {
    throw new Error('Integration tests must use DATABASE_URL on port 5432.')
  }
  return createDb(url)
}

export function getRuntimeDb() {
  if (!globalForDb.__onrecordRuntimeDb) {
    globalForDb.__onrecordRuntimeDb = process.env.VITEST
      ? createTestSessionDb()
      : createRuntimeDb()
  }
  return globalForDb.__onrecordRuntimeDb
}

export async function resetRuntimeDb() {
  const current = globalForDb.__onrecordRuntimeDb
  globalForDb.__onrecordRuntimeDb = undefined
  if (current) await current.client.end({ timeout: 2 })
}
