import type { BillingSubscription } from '@/billing/gateway'
import { getRuntimeDb } from '@/db/runtime'
import { subscriptions } from '@/db/schema'

type Db = Pick<ReturnType<typeof getRuntimeDb>['db'], 'insert'>

/** A provider-confirmed cache; feature entitlement comes from the provider itself. */
export async function cacheSubscription(db: Db, accountId: string, sub: BillingSubscription) {
  const values = {
    stripeCustomerId: sub.customerId, stripeSubId: sub.id, plan: 'base', status: sub.status,
    monthlyCents: sub.monthlyCents ?? null, currentPeriodEnd: sub.currentPeriodEnd, cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  }
  await db.insert(subscriptions).values({ accountId, ...values }).onConflictDoUpdate({ target: subscriptions.accountId, set: values })
}
