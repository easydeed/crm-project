import { createSessionDb } from '@/db/client'

/** Dedicated direct session; commits on the runtime connection remain durable. */
export async function withOperationLock<T>(key: string, work: () => Promise<T>) {
  const handle = createSessionDb()
  try {
    await handle.client`select pg_advisory_lock(hashtext(${key}))`
    return await work()
  } finally {
    try { await handle.client`select pg_advisory_unlock(hashtext(${key}))` }
    finally { await handle.client.end({ timeout: 2 }) }
  }
}
