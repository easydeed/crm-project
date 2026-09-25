import { eq } from 'drizzle-orm'
import type { getRuntimeDb } from '@/db/runtime'
import { subscriptions } from '@/db/schema'
import type { BillingState } from '@/billing/status'

type Db = ReturnType<typeof getRuntimeDb>['db']

export async function loadBillingState(db: Db, accountId: string): Promise<BillingState> {
  const [row] = await db
    .select({
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
    })
    .from(subscriptions)
    .where(eq(subscriptions.accountId, accountId))
    .limit(1)
  return row ?? null
}
