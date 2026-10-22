import { assertPaidPrice } from '@/billing/paid-state'
import type { BillingSubscription } from '@/billing/gateway'
import { getRuntimeDb } from '@/db/runtime'
import { jobs, subscriptions } from '@/db/schema'

type Db = Pick<ReturnType<typeof getRuntimeDb>['db'], 'insert'>

/** Provider-confirmed price and entitlement, atomically stored by caller transaction. */
export async function cacheSubscription(db: Db, accountId: string, sub: BillingSubscription) {
  if (sub.addonKeys != null) assertPaidPrice(sub.addonKeys, sub.monthlyCents)
  const values = {
    stripeCustomerId: sub.customerId, stripeSubId: sub.id, plan: 'base', status: sub.status,
    monthlyCents: sub.monthlyCents ?? null, currentPeriodEnd: sub.currentPeriodEnd, cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  }
  await db.insert(subscriptions).values({ accountId, ...values }).onConflictDoUpdate({ target: subscriptions.accountId, set: values })
  if (sub.addonKeys != null) {
    const now = new Date()
    await db.insert(jobs).values({ kind: 'billing_reconcile', payloadKey: `snapshot:${accountId}:${sub.id}`, payload: { accountId, subscriptionId: sub.id, addonKeys: sub.addonKeys }, runAfter: now, enqueuedFor: now, completedAt: now }).onConflictDoUpdate({ target: [jobs.kind, jobs.payloadKey, jobs.enqueuedFor], set: { payload: { accountId, subscriptionId: sub.id, addonKeys: sub.addonKeys }, completedAt: now } })
  }
}
