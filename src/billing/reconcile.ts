import { eq } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { subscriptions } from '@/db/schema'
import { getBillingGateway } from '@/billing/current'
import { cacheSubscription } from '@/billing/cache-subscription'
import { withBillingLock } from '@/billing/account-lock'
import type { JobHandler } from '@/jobs/types'

/** Only mutation/webhook/background paths contact Stripe, never feature reads. */
export async function refreshPaidSnapshot(accountId: string) {
  const { db } = getRuntimeDb()
  const [row] = await db.select().from(subscriptions).where(eq(subscriptions.accountId, accountId))
  if (!row?.stripeSubId) return
  const sub = await getBillingGateway().getSubscription(row.stripeSubId)
  if (sub.accountId !== accountId) throw new Error('Subscription belongs to another account')
  await db.transaction((tx) => cacheSubscription(tx, accountId, sub))
}

export const reconcileBilling: JobHandler = async (payload) => {
  const accountId = String(payload.accountId)
  await withBillingLock(accountId, () => refreshPaidSnapshot(accountId))
}
