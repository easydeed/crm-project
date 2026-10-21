import { and, desc, eq, isNotNull, sql } from 'drizzle-orm'
import { getAddonRegistry } from '@/addons/registry'
import { demoBilling } from '@/billing/demo-checkout'
import { PLAN } from '@/config/costs'
import { getRuntimeDb } from '@/db/runtime'
import { jobs, subscriptions } from '@/db/schema'

export function assertPaidPrice(keys: string[], cents: number | null | undefined) {
  const expected = PLAN.priceCents + keys.reduce((sum, key) => {
    const addon = getAddonRegistry().get(key)
    if (!addon || addon.priceCents <= 0) throw new Error('Unrecognized paid subscription feature')
    return sum + addon.priceCents
  }, 0)
  if (cents !== expected) throw new Error('Subscription price and features require reconciliation')
}

/** Dashboard/text feature checks are DB-only, including during a Stripe outage.
 * Confirmed snapshots are completed reconciliation receipts in the existing queue.
 */
export async function paidAddonKeys(accountId: string, storedKeys: string[]): Promise<string[] | null> {
  if (demoBilling()) return null
  const { db } = getRuntimeDb()
  const [row] = await db.select().from(subscriptions).where(eq(subscriptions.accountId, accountId))
  if (!row?.stripeSubId || row.status === 'canceled') return null
  const [snapshot] = await db.select().from(jobs).where(and(eq(jobs.kind, 'billing_reconcile'), isNotNull(jobs.completedAt), eq(jobs.payloadKey, `snapshot:${accountId}:${row.stripeSubId}`), sql`${jobs.payload} ? 'addonKeys'`)).orderBy(desc(jobs.completedAt)).limit(1)
  const keys = snapshot?.payload.addonKeys as string[] | undefined
  if (keys) return keys
  // Legacy cache: use only a locally price-consistent state; never fetch in a read.
  if (row.monthlyCents == null) return storedKeys
  try { assertPaidPrice(storedKeys, row.monthlyCents); return storedKeys }
  catch { return [] }
}
