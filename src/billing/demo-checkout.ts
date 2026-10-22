import { PLAN } from '@/config/costs'
import { eq } from 'drizzle-orm'
import { isHostedDemo } from '@/config/demo'
import { isLocalE2E } from '@/config/e2e'
import { openToken, sealToken } from '@/auth/signed-token'
import { getRuntimeDb } from '@/db/runtime'
import { subscriptions } from '@/db/schema'
import type { CheckoutInput } from '@/billing/gateway'
import { accountMonthlyTotal } from '@/billing/addon-billing'
import { withTransactionDb } from '@/db/runtime'
import { sql } from 'drizzle-orm'

export const demoBilling = () => isLocalE2E() || isHostedDemo()
type Checkout = { accountId: string; successPath: string; monthlyCents: number }

export function demoCheckoutUrl(input: CheckoutInput) {
  const destination = new URL(input.successUrl)
  const successPath = destination.pathname === '/app/start' ? '/app/start' : '/app/settings/billing?checkout=done'
  const token = sealToken('demo-checkout', { accountId: input.accountId, successPath, monthlyCents: input.monthlyCents ?? PLAN.priceCents }, Date.now() + 30 * 60_000)
  return `/app/settings/billing/demo-checkout?token=${encodeURIComponent(token)}`
}

export function readDemoCheckout(token: string, accountId: string) {
  if (!demoBilling()) return null
  const data = openToken<Checkout>(token, 'demo-checkout')
  return data?.accountId === accountId ? data : null
}

export async function completeDemoCheckout(token: string, accountId: string) {
  const data = readDemoCheckout(token, accountId)
  if (!data) throw new Error('This demo checkout expired. Start again from Billing.')
  const { db } = getRuntimeDb()
  const values = {
    stripeCustomerId: `cus_demo_${accountId}`, stripeSubId: `sub_demo_${accountId}`,
    plan: 'base', status: 'active', cancelAtPeriodEnd: false,
    currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000),
  }
  // Replaying a confirmation cannot extend or uncancel an existing active plan.
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${accountId}))`)
    const [existing] = await tx.select().from(subscriptions).where(eq(subscriptions.accountId, accountId)).for('update')
    if (existing?.status === 'active') return
    const monthlyCents = await withTransactionDb(tx as unknown as typeof db, () => accountMonthlyTotal(accountId))
    await tx.insert(subscriptions).values({ accountId, ...values, monthlyCents }).onConflictDoUpdate({ target: subscriptions.accountId, set: { ...values, monthlyCents } })
  })
  return data.successPath
}
