import { getRuntimeDb } from '@/db/runtime'
import { subscriptions } from '@/db/schema'

/**
 * Integration tests that send need a paying account. This writes the cached row the
 * webhook would have written. Never called outside tests.
 */
export async function giveActiveSubscription(accountId: string, periodEnd = new Date('2099-01-01T00:00:00Z')) {
  const { db } = getRuntimeDb()
  const suffix = accountId.slice(0, 8)
  await db
    .insert(subscriptions)
    .values({
      accountId,
      stripeCustomerId: `cus_fixture_${suffix}_${accountId}`,
      stripeSubId: `sub_fixture_${suffix}_${accountId}`,
      plan: 'base',
      status: 'active',
      currentPeriodEnd: periodEnd,
    })
    .onConflictDoUpdate({ target: subscriptions.accountId, set: { status: 'active', currentPeriodEnd: periodEnd, cancelAtPeriodEnd: false } })
}
