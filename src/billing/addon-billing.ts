import { eq } from 'drizzle-orm'
import { loadAddonStates } from '@/addons/state'
import { getBillingGateway } from '@/billing/current'
import { PLAN } from '@/config/costs'
import { getRuntimeDb } from '@/db/runtime'
import { subscriptions } from '@/db/schema'

/** Synchronize the next renewal before reporting a paid switch as successful. */
export async function syncAddonBilling(accountId: string, key: string, enabled: boolean) {
  const { db } = getRuntimeDb()
  const [row] = await db.select().from(subscriptions).where(eq(subscriptions.accountId, accountId)).limit(1)
  // An account without a paid plan can configure add-ons; checkout includes them.
  if (!row?.stripeSubId || row.status === 'canceled') return
  const { states } = await loadAddonStates(accountId)
  const total = PLAN.priceCents + states.reduce((sum, state) =>
    sum + ((state.addon.key === key ? enabled : state.enabled) ? state.addon.priceCents : 0), 0)
  await getBillingGateway().setMonthlyTotal(row.stripeSubId, total)
}

export async function accountMonthlyTotal(accountId: string) {
  const { states } = await loadAddonStates(accountId)
  return PLAN.priceCents + states.reduce((sum, state) => sum + (state.enabled ? state.addon.priceCents : 0), 0)
}
