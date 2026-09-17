import { createRuntimeDb } from './client'

type RuntimeDb = ReturnType<typeof createRuntimeDb>

const globalForDb = globalThis as { __onrecordRuntimeDb?: RuntimeDb }

export function getRuntimeDb() {
  if (!globalForDb.__onrecordRuntimeDb) {
    globalForDb.__onrecordRuntimeDb = createRuntimeDb()
  }
  return globalForDb.__onrecordRuntimeDb
}
