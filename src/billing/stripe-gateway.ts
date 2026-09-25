import type { BillingGateway, BillingInvoice, BillingSubscription, CheckoutInput } from '@/billing/gateway'

const API = 'https://api.stripe.com/v1'

/** Test mode only. A key that is not a test key is refused before any request is made. */
export function stripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? ''
  if (!key) throw new Error('Stripe is not configured: STRIPE_SECRET_KEY is empty')
  if (!key.startsWith('sk_test_')) throw new Error('Stripe runs in test mode only: STRIPE_SECRET_KEY must be a test key')
  return key
}

function stripePriceId(): string {
  const price = process.env.STRIPE_PRICE_ID?.trim() ?? ''
  if (!price) throw new Error('Stripe is not configured: STRIPE_PRICE_ID is empty')
  return price
}

type Json = Record<string, unknown>

async function call(method: 'GET' | 'POST', path: string, params: Record<string, string> = {}): Promise<Json> {
  const body = new URLSearchParams(params).toString()
  const url = method === 'GET' && body ? `${API}${path}?${body}` : `${API}${path}`
  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${stripeSecretKey()}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: method === 'POST' ? body : undefined,
    cache: 'no-store',
  })
  const json = (await response.json().catch(() => ({}))) as Json
  if (!response.ok) {
    const message = (json.error as Json | undefined)?.message
    throw new Error(`Stripe ${method} ${path} failed (${response.status}): ${String(message ?? 'no message')}`)
  }
  return json
}

function epoch(value: unknown): Date | null {
  return typeof value === 'number' ? new Date(value * 1000) : null
}

function idOf(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && typeof (value as Json).id === 'string') return (value as Json).id as string
  return ''
}

/** Newer API versions carry the period end on the subscription item, older ones on the subscription. */
export function toSubscription(raw: Json): BillingSubscription {
  const items = ((raw.items as Json | undefined)?.data as Json[] | undefined) ?? []
  const card = ((raw.default_payment_method as Json | undefined)?.card as Json | undefined) ?? undefined
  const metadata = (raw.metadata as Json | undefined) ?? {}
  return {
    id: String(raw.id ?? ''),
    customerId: idOf(raw.customer),
    status: String(raw.status ?? ''),
    currentPeriodEnd: epoch(raw.current_period_end) ?? epoch(items[0]?.current_period_end),
    cancelAtPeriodEnd: raw.cancel_at_period_end === true,
    accountId: typeof metadata.account_id === 'string' ? metadata.account_id : null,
    cardLast4: typeof card?.last4 === 'string' ? card.last4 : null,
  }
}

export class StripeGateway implements BillingGateway {
  async createCheckoutSession(input: CheckoutInput) {
    const params: Record<string, string> = {
      mode: 'subscription',
      'line_items[0][price]': stripePriceId(),
      'line_items[0][quantity]': '1',
      client_reference_id: input.accountId,
      'subscription_data[metadata][account_id]': input.accountId,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    }
    if (input.customerId) params.customer = input.customerId
    else params.customer_email = input.email
    const session = await call('POST', '/checkout/sessions', params)
    if (typeof session.url !== 'string') throw new Error('Stripe returned a checkout session without a URL')
    return { url: session.url }
  }

  async getSubscription(subscriptionId: string) {
    const raw = await call('GET', `/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      'expand[]': 'default_payment_method',
    })
    return toSubscription(raw)
  }

  async setCancelAtPeriodEnd(subscriptionId: string, cancel: boolean) {
    await call('POST', `/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      cancel_at_period_end: cancel ? 'true' : 'false',
    })
  }

  async listInvoices(customerId: string): Promise<BillingInvoice[]> {
    const list = await call('GET', '/invoices', { customer: customerId, limit: '24' })
    const data = (list.data as Json[] | undefined) ?? []
    return data.map((raw) => ({
      id: String(raw.id ?? ''),
      created: epoch(raw.created) ?? new Date(0),
      amountCents: Number(raw.status === 'paid' ? raw.amount_paid : raw.amount_due) || 0,
      status: String(raw.status ?? ''),
      url: typeof raw.hosted_invoice_url === 'string' ? raw.hosted_invoice_url : null,
    }))
  }
}
