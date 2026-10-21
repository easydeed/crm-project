import { withOperationLock } from '@/db/operation-lock'

/** A dedicated direct connection: never put a session lock on a transaction pooler.
 * Configuration transactions commit before provider calls; this lock spans both.
 */
export async function withBillingLock<T>(accountId: string, work: () => Promise<T>) {
  return withOperationLock(`billing:${accountId}`, work)
}
