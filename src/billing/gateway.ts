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
  successUrl: string
  cancelUrl: string
}

export interface BillingGateway {
  createCheckoutSession(input: CheckoutInput): Promise<{ url: string }>
  getSubscription(subscriptionId: string): Promise<BillingSubscription>
  setCancelAtPeriodEnd(subscriptionId: string, cancel: boolean): Promise<void>
  listInvoices(customerId: string): Promise<BillingInvoice[]>
}
