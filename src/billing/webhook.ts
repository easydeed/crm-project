import { eq } from 'drizzle-orm'
import { getBillingGateway } from '@/billing/current'
import type { BillingSubscription } from '@/billing/gateway'
import { verifyStripeSignature } from '@/billing/signature'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, subscriptions } from '@/db/schema'
import { stripeEvents } from '@/db/schema-billing'

type Json = Record<string, unknown>
export type WebhookOutcome = 'bad_signature' | 'duplicate' | 'applied' | 'recorded'

export const HANDLED_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
] as const

export const PLAN = 'base'

function str(value: unknown): string | null {
  if (typeof value === 'string' && value) return value
  if (value && typeof value === 'object' && typeof (value as Json).id === 'string') return (value as Json).id as string
  return null
}

/** Invoices name their subscription in one of two places depending on the API version. */
function invoiceSubscriptionId(invoice: Json): string | null {
  const parent = (invoice.parent as Json | undefined)?.subscription_details as Json | undefined
  return str(invoice.subscription) ?? str(parent?.subscription)
}

function subscriptionIdFor(type: string, object: Json): string | null {
  if (type === 'checkout.session.completed') return str(object.subscription)
  if (type === 'invoice.payment_failed') return invoiceSubscriptionId(object)
  return str(object.id)
}

/**
 * Every handled event re-reads the subscription from Stripe instead of trusting the
 * event body. Stripe does not promise delivery order, and the current state is what
 * the cache should hold. A failed renewal shows up here as Stripe's past_due.
 */
export async function handleStripeWebhook(rawBody: string, signature: string | null, now = new Date()): Promise<WebhookOutcome> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? ''
  if (!verifyStripeSignature(rawBody, signature, secret, now)) return 'bad_signature'
  const event = JSON.parse(rawBody) as Json
  const eventId = str(event.id)
  const type = String(event.type ?? '')
  if (!eventId) return 'bad_signature'

  const { db } = getRuntimeDb()
  const [seen] = await db.select({ id: stripeEvents.id }).from(stripeEvents).where(eq(stripeEvents.id, eventId)).limit(1)
  if (seen) return 'duplicate'

  const object = ((event.data as Json | undefined)?.object as Json | undefined) ?? {}
  const subId = (HANDLED_EVENTS as readonly string[]).includes(type) ? subscriptionIdFor(type, object) : null
  const sub = subId ? await getBillingGateway().getSubscription(subId) : null

  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(stripeEvents)
      .values({ id: eventId, type, payload: event })
      .onConflictDoNothing()
      .returning({ id: stripeEvents.id })
    if (inserted.length === 0) return 'duplicate'
    if (!sub) return 'recorded'

    const [cached] = await tx
      .select({ accountId: subscriptions.accountId })
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubId, sub.id))
      .limit(1)
    const accountId = cached?.accountId ?? str(object.client_reference_id) ?? sub.accountId
    if (!accountId || !(await accountExists(tx, accountId))) return 'recorded'
    await writeSubscription(tx, accountId, sub)
    return 'applied'
  })
}

type Tx = Parameters<Parameters<ReturnType<typeof getRuntimeDb>['db']['transaction']>[0]>[0]

async function accountExists(tx: Tx, accountId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(accountId)) return false
  const [row] = await tx.select({ id: accounts.id }).from(accounts).where(eq(accounts.id, accountId)).limit(1)
  return Boolean(row)
}

async function writeSubscription(tx: Tx, accountId: string, sub: BillingSubscription) {
  const values = {
    stripeCustomerId: sub.customerId,
    stripeSubId: sub.id,
    plan: PLAN,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  }
  await tx
    .insert(subscriptions)
    .values({ accountId, ...values })
    .onConflictDoUpdate({ target: subscriptions.accountId, set: values })
}
