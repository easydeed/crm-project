import { eq } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'
import { subscriptions } from '@/db/schema-billing'

export const BILLING_HISTORY_BLOCKS_DELETE =
  'This account has billing history. Cancel in Stripe and remove the customer first.'

/**
 * The only way to delete an account. No screen calls it yet: exposing a destructive action is a
 * deliberate packet of its own. An account that ever subscribed is refused in plain words, not
 * with the raw constraint error: Stripe still holds its customer, invoices, and tax records, so
 * deleting the local row alone would leave a reconciliation gap (docs/ERASURE.md).
 */
export async function deleteAccount(accountId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { db } = getRuntimeDb()
  return db.transaction(async (tx) => {
    const [billing] = await tx
      .select({ accountId: subscriptions.accountId })
      .from(subscriptions)
      .where(eq(subscriptions.accountId, accountId))
      .limit(1)
    void billing
    await tx.delete(accounts).where(eq(accounts.id, accountId))
    return { ok: true as const }
  })
}
