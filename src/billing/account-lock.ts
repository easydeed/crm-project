import { withOperationLock } from '@/db/operation-lock'

/** Pooler-safe transaction lock; configuration commits precede provider calls. */
export async function withBillingLock<T>(accountId: string, work: () => Promise<T>) {
  return withOperationLock(`billing:${accountId}`, work)
}
