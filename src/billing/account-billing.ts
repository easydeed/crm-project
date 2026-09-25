import { eq } from 'drizzle-orm'
import { getBillingGateway } from '@/billing/current'
import type { BillingInvoice } from '@/billing/gateway'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, subscriptions } from '@/db/schema'
import { publicOrigin } from '@/unsubscribe/links'

export type BillingView =
  | { kind: 'none' }
  | {
      kind: 'subscribed'
      status: string
      currentPeriodEnd: Date | null
      cancelAtPeriodEnd: boolean
      cardLast4: string | null
      invoices: BillingInvoice[]
    }

async function cachedRow(accountId: string) {
  const { db } = getRuntimeDb()
  const [row] = await db.select().from(subscriptions).where(eq(subscriptions.accountId, accountId)).limit(1)
  return row ?? null
}

/** Reads Stripe directly, so the page shows a cancel or resume the moment it happens. */
export async function loadBillingView(accountId: string): Promise<BillingView> {
  const row = await cachedRow(accountId)
  if (!row?.stripeSubId || !row.stripeCustomerId) return { kind: 'none' }
  const gateway = getBillingGateway()
  const [sub, invoices] = await Promise.all([
    gateway.getSubscription(row.stripeSubId),
    gateway.listInvoices(row.stripeCustomerId),
  ])
  return {
    kind: 'subscribed',
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    cardLast4: sub.cardLast4,
    invoices,
  }
}

/** A Stripe Checkout URL for the plan. A returning account reuses its Stripe customer. */
export async function startCheckout(accountId: string): Promise<string> {
  const { db } = getRuntimeDb()
  const [account] = await db.select({ email: accounts.email }).from(accounts).where(eq(accounts.id, accountId)).limit(1)
  if (!account) throw new Error('Account not found')
  const row = await cachedRow(accountId)
  const billingUrl = `${publicOrigin()}/app/settings/billing`
  const { url } = await getBillingGateway().createCheckoutSession({
    accountId,
    email: account.email,
    customerId: row?.stripeCustomerId ?? null,
    successUrl: `${billingUrl}?checkout=done`,
    cancelUrl: billingUrl,
  })
  return url
}

/**
 * Cancel or resume at period end. Stripe is told; the cached row changes only when
 * Stripe's webhook arrives. Resume is only possible before the period ends.
 */
export async function setCancelAtPeriodEnd(accountId: string, cancel: boolean, now = new Date()) {
  const row = await cachedRow(accountId)
  if (!row?.stripeSubId) throw new Error('This account has no subscription')
  const sub = await getBillingGateway().getSubscription(row.stripeSubId)
  if (sub.status !== 'active') throw new Error('Only an active plan can be canceled or resumed')
  if (!cancel && sub.currentPeriodEnd && now >= sub.currentPeriodEnd) throw new Error('This plan has already ended')
  if (sub.cancelAtPeriodEnd === cancel) return
  await getBillingGateway().setCancelAtPeriodEnd(row.stripeSubId, cancel)
}
