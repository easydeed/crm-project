/** What the app needs from Stripe. StripeGateway talks to the API; FakeBillingGateway stands in for tests. */
export type BillingSubscription = {
  id: string
  customerId: string
  status: string
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  /** Set from subscription_data.metadata at checkout, so any subscription event can find its account. */
  accountId: string | null
  cardLast4: string | null
  monthlyCents?: number | null
  addonKeys?: string[] | null
}

export type BillingInvoice = {
  id: string
  created: Date
  amountCents: number
  status: string
  url: string | null
}

export type CheckoutInput = {
  accountId: string
  email: string
  /** Reuse the Stripe customer when an account that canceled comes back. */
  customerId: string | null
  monthlyCents?: number
  addonKeys?: string[]
  expiresAt?: number
  successUrl: string
  cancelUrl: string
}

/**
 * Stripe answered and has no such subscription (404 resource_missing). It is not a failure to reach
 * Stripe, so retrying never helps: billing shows it in the page, not as the "couldn't reach" error.
 */
export class SubscriptionNotFound extends Error {
  constructor(readonly subscriptionId: string) {
    super(`No such subscription: ${subscriptionId}`)
    this.name = 'SubscriptionNotFound'
  }
}

export interface BillingGateway {
  createCheckoutSession(input: CheckoutInput): Promise<{ url: string; id?: string }>
  getCheckoutSession(sessionId: string): Promise<{ status: string; url: string | null; subscriptionId: string | null; accountId: string | null }>
  getSubscription(subscriptionId: string): Promise<BillingSubscription>
  setCancelAtPeriodEnd(subscriptionId: string, cancel: boolean): Promise<void>
  setMonthlyTotal(subscriptionId: string, cents: number, addonKeys?: string[]): Promise<void>
  listInvoices(customerId: string): Promise<BillingInvoice[]>
}
