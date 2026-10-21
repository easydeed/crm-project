import { randomUUID } from 'node:crypto'
import { SubscriptionNotFound, type BillingGateway, type BillingInvoice, type BillingSubscription, type CheckoutInput } from '@/billing/gateway'

/** Plays Stripe in tests. Holds subscriptions in memory; nothing leaves the process. */
export class FakeBillingGateway implements BillingGateway {
  readonly subscriptions = new Map<string, BillingSubscription>()
  readonly invoices = new Map<string, BillingInvoice[]>()
  readonly checkouts: CheckoutInput[] = []
  readonly checkoutSessions = new Map<string, { status: string; url: string; subscriptionId: string | null; accountId: string }>()

  async createCheckoutSession(input: CheckoutInput): Promise<{ url: string; id?: string }> {
    this.checkouts.push(input)
    const id = `cs_test_${this.checkouts.length}`
    const url = `https://checkout.stripe.test/${this.checkouts.length}`
    this.checkoutSessions.set(id, { status: 'open', url, subscriptionId: null, accountId: input.accountId })
    return { url, id }
  }

  async getCheckoutSession(sessionId: string) {
    const session = this.checkoutSessions.get(sessionId)
    if (!session) throw new Error('Checkout not found')
    return { ...session }
  }

  /** What Stripe does when the agent pays: a customer and an active subscription exist. */
  completeCheckout(input: CheckoutInput, periodEnd: Date): BillingSubscription {
    const sub: BillingSubscription = {
      id: `sub_test_${randomUUID().slice(0, 8)}`,
      customerId: input.customerId ?? `cus_test_${randomUUID().slice(0, 8)}`,
      status: 'active',
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      accountId: input.accountId,
      cardLast4: '4242',
      monthlyCents: input.monthlyCents,
      addonKeys: input.addonKeys,
    }
    this.subscriptions.set(sub.id, sub)
    const session = this.checkoutSessions.get(`cs_test_${this.checkouts.indexOf(input) + 1}`)
    if (session) Object.assign(session, { status: 'complete', subscriptionId: sub.id })
    return sub
  }

  update(subscriptionId: string, change: Partial<BillingSubscription>) {
    const sub = this.subscriptions.get(subscriptionId)
    if (!sub) throw new SubscriptionNotFound(subscriptionId)
    this.subscriptions.set(subscriptionId, { ...sub, ...change })
  }

  async getSubscription(subscriptionId: string) {
    const sub = this.subscriptions.get(subscriptionId)
    if (!sub) throw new SubscriptionNotFound(subscriptionId)
    return { ...sub }
  }

  async setCancelAtPeriodEnd(subscriptionId: string, cancel: boolean) {
    const sub = await this.getSubscription(subscriptionId)
    if (sub.status === 'canceled') throw new Error('A canceled subscription cannot be changed')
    this.update(subscriptionId, { cancelAtPeriodEnd: cancel })
  }

  async setMonthlyTotal(subscriptionId: string, cents: number, addonKeys?: string[]) {
    this.update(subscriptionId, { monthlyCents: cents, ...(addonKeys ? { addonKeys } : {}) })
  }

  async listInvoices(customerId: string) {
    return this.invoices.get(customerId) ?? []
  }
}
