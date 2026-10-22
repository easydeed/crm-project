import { demoBilling } from '@/billing/demo-checkout'
import { assertPaidPrice } from '@/billing/paid-state'
import { cacheSubscription } from '@/billing/cache-subscription'
import { refreshPaidSnapshot } from '@/billing/reconcile'
import { enqueue } from '@/jobs/enqueue'
import { eq } from 'drizzle-orm'
import { isAddonEnabled, loadAddonStates } from '@/addons/state'
import { getBillingGateway } from '@/billing/current'
import { PLAN } from '@/config/costs'
import { getRuntimeDb } from '@/db/runtime'
import { subscriptions } from '@/db/schema'

/** Initialize legacy metadata only after proving the existing amount matches. */
export async function initializeAddonBilling(accountId: string, key: string) {
  const [row] = await getRuntimeDb().db.select().from(subscriptions).where(eq(subscriptions.accountId, accountId))
  if (!row?.stripeSubId) return
  const sub = await getBillingGateway().getSubscription(row.stripeSubId)
  if (sub.status === 'canceled' || sub.addonKeys != null) {
    await getRuntimeDb().db.transaction((tx) => cacheSubscription(tx, accountId, sub))
    return
  }
  const { states } = await loadAddonStates(accountId)
  assertPaidPrice(states.filter((state) => state.enabled && state.addon.priceCents > 0).map((state) => state.addon.key), sub.monthlyCents)
  await syncAddonBilling(accountId, key, await isAddonEnabled(accountId, key))
}

/** Synchronize the next renewal before reporting a paid switch as successful. */
export async function syncAddonBilling(accountId: string, key: string, enabled: boolean) {
  const { db } = getRuntimeDb()
  const [row] = await db.select().from(subscriptions).where(eq(subscriptions.accountId, accountId)).limit(1)
  // An account without a paid plan can configure add-ons; checkout includes them.
  if (!row?.stripeSubId) return
  const sub = await getBillingGateway().getSubscription(row.stripeSubId)
  if (sub.status === 'canceled') return
  const { states } = await loadAddonStates(accountId)
  const total = PLAN.priceCents + states.reduce((sum, state) =>
    sum + ((state.addon.key === key ? enabled : state.enabled) ? state.addon.priceCents : 0), 0)
  const keys = states.filter((state) => state.addon.priceCents > 0 && (state.addon.key === key ? enabled : state.enabled)).map((state) => state.addon.key).sort()
  if (demoBilling()) { await getBillingGateway().setMonthlyTotal(row.stripeSubId, total, keys); return }
  await enqueue('billing_reconcile', { accountId, requestedAt: crypto.randomUUID() }, new Date())
  try { await getBillingGateway().setMonthlyTotal(row.stripeSubId, total, keys) }
  catch (error) {
    // A response can be lost after acceptance; best-effort refresh, durable retry remains.
    try { await refreshPaidSnapshot(accountId) } catch { /* pending reconciliation owns retry */ }
    throw error
  }
  await refreshPaidSnapshot(accountId)
}

export async function accountMonthlyTotal(accountId: string) {
  const { states } = await loadAddonStates(accountId)
  return PLAN.priceCents + states.reduce((sum, state) => sum + (state.enabled ? state.addon.priceCents : 0), 0)
}
