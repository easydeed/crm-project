import { eq } from 'drizzle-orm'
import { getAddonRegistry } from '@/addons/registry'
import { getBillingGateway } from '@/billing/current'
import { demoBilling } from '@/billing/demo-checkout'
import { PLAN } from '@/config/costs'
import { getRuntimeDb } from '@/db/runtime'
import { subscriptions } from '@/db/schema'

/** Price and paid entitlements are one atomic provider object, not two writers. */
export async function paidAddonKeys(accountId: string): Promise<string[] | null> {
  if (demoBilling()) return null // The demo price and switches share a DB transaction.
  const [row] = await getRuntimeDb().db.select().from(subscriptions).where(eq(subscriptions.accountId, accountId))
  if (!row?.stripeSubId) return null
  const sub = await getBillingGateway().getSubscription(row.stripeSubId)
  if (sub.status === 'canceled') return null
  if (sub.addonKeys == null) return null // Legacy plan; initialized before its first switch.
  const expected = PLAN.priceCents + sub.addonKeys.reduce((sum, key) => {
    const addon = getAddonRegistry().get(key)
    if (!addon || addon.priceCents <= 0) throw new Error('Unrecognized paid subscription feature')
    return sum + addon.priceCents
  }, 0)
  if (sub.monthlyCents !== expected) throw new Error('Subscription price and features require reconciliation')
  return sub.addonKeys
}
