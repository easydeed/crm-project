import { SubscriptionNotFound, type BillingGateway, type BillingInvoice, type BillingSubscription, type CheckoutInput } from '@/billing/gateway'

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

/** A request Stripe answered with an error, carrying its status and code so callers can tell "no such thing" from a failure. */
class StripeRequestError extends Error {
  constructor(message: string, readonly status: number, readonly code: unknown) {
    super(message)
  }
}

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
    signal: AbortSignal.timeout(15_000),
  })
  const json = (await response.json().catch(() => ({}))) as Json
  if (!response.ok) {
    const error = (json.error as Json | undefined) ?? {}
    throw new StripeRequestError(`Stripe ${method} ${path} failed (${response.status}): ${String(error.message ?? 'no message')}`, response.status, error.code)
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

function addonKeys(value: unknown): string[] | null {
  if (value === undefined) return null
  const keys: unknown = JSON.parse(String(value))
  if (!Array.isArray(keys) || keys.some((key) => typeof key !== 'string') || new Set(keys).size !== keys.length) throw new Error('Invalid paid-feature metadata')
  return keys
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
    addonKeys: addonKeys(metadata.addon_keys),
    monthlyCents: items.length && items.every((item) => typeof (item.price as Json | undefined)?.unit_amount === 'number') ? items.reduce((total, item) => total + Number((item.price as Json | undefined)?.unit_amount ?? 0) * Number(item.quantity ?? 1), 0) : null,
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
      'subscription_data[metadata][addon_keys]': JSON.stringify(input.addonKeys ?? []),
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    }
    if (input.monthlyCents && input.monthlyCents > 0) {
      const price = await call('GET', `/prices/${encodeURIComponent(stripePriceId())}`)
      if (price.unit_amount !== input.monthlyCents) {
        delete params['line_items[0][price]']
        params['line_items[0][price_data][currency]'] = 'usd'
        params['line_items[0][price_data][product]'] = idOf(price.product)
        params['line_items[0][price_data][unit_amount]'] = String(input.monthlyCents)
        params['line_items[0][price_data][recurring][interval]'] = 'month'
      }
    }
    if (input.customerId) params.customer = input.customerId
    else params.customer_email = input.email
    if (input.expiresAt) params.expires_at = String(input.expiresAt)
    const session = await call('POST', '/checkout/sessions', params)
    if (typeof session.url !== 'string' || typeof session.id !== 'string') throw new Error('Stripe returned an incomplete checkout session')
    return { url: session.url, id: String(session.id) }
  }

  // Paginate the recorded attempt window, including old completed sessions;
  // never assume the first page contains this account's lost response.
  async findCheckoutSessions(accountId: string, createdAfter: number, createdBefore: number) {
    const found: ({ id: string } & Awaited<ReturnType<StripeGateway['getCheckoutSession']>>)[] = []
    let after = ''
    for (let page = 0; page < 20; page++) {
      const raw = await call('GET', '/checkout/sessions', { limit: '100', 'created[gte]': String(createdAfter), 'created[lte]': String(createdBefore), ...(after ? { starting_after: after } : {}) })
      const data = (raw.data as Json[] | undefined) ?? []
      for (const session of data) if (session.client_reference_id === accountId && session.status !== 'expired') found.push({ id: String(session.id), status: String(session.status), url: typeof session.url === 'string' ? session.url : null, subscriptionId: idOf(session.subscription) || null, accountId })
      if (!raw.has_more) return found
      after = String(data.at(-1)?.id ?? '')
      if (!after) break
    }
    throw new Error('Checkout recovery is busy. Try again later.')
  }

  async getCheckoutSession(sessionId: string) {
    const raw = await call('GET', `/checkout/sessions/${encodeURIComponent(sessionId)}`)
    return { status: String(raw.status), url: typeof raw.url === 'string' ? raw.url : null, subscriptionId: idOf(raw.subscription) || null, accountId: typeof raw.client_reference_id === 'string' ? raw.client_reference_id : null }
  }

  async getSubscription(subscriptionId: string) {
    try {
      const raw = await call('GET', `/subscriptions/${encodeURIComponent(subscriptionId)}`, {
        'expand[]': 'default_payment_method',
      })
      return toSubscription(raw)
    } catch (err) {
      if (err instanceof StripeRequestError && err.status === 404 && err.code === 'resource_missing') throw new SubscriptionNotFound(subscriptionId)
      throw err
    }
  }

  async setCancelAtPeriodEnd(subscriptionId: string, cancel: boolean) {
    await call('POST', `/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      cancel_at_period_end: cancel ? 'true' : 'false',
    })
  }

  async setMonthlyTotal(subscriptionId: string, cents: number, addonKeys?: string[]) {
    const raw = await call('GET', `/subscriptions/${encodeURIComponent(subscriptionId)}`)
    const items = ((raw.items as Json | undefined)?.data as Json[] | undefined) ?? []
    if (items.length !== 1 || !Number.isSafeInteger(cents) || cents <= 0) throw new Error('Unsupported subscription pricing')
    const item = items[0]
    const price = item.price as Json
    const recurring = price.recurring as Json | undefined
    if (price.currency !== 'usd' || recurring?.interval !== 'month' || Number(item.quantity ?? 1) !== 1) throw new Error('Expected one monthly USD plan')
    if (price.unit_amount === cents && addonKeys === undefined) return
    await call('POST', `/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      'items[0][id]': String(item.id),
      'items[0][price_data][currency]': 'usd',
      'items[0][price_data][product]': idOf(price.product),
      'items[0][price_data][unit_amount]': String(cents),
      'items[0][price_data][recurring][interval]': 'month',
      proration_behavior: 'none',
      ...(addonKeys ? { 'metadata[addon_keys]': JSON.stringify(addonKeys) } : {}),
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
