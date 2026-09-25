import { randomUUID } from 'node:crypto'
import type { BillingGateway, BillingInvoice, BillingSubscription, CheckoutInput } from '@/billing/gateway'

/** Plays Stripe in tests. Holds subscriptions in memory; nothing leaves the process. */
export class FakeBillingGateway implements BillingGateway {
  readonly subscriptions = new Map<string, BillingSubscription>()
  readonly invoices = new Map<string, BillingInvoice[]>()
  readonly checkouts: CheckoutInput[] = []

  async createCheckoutSession(input: CheckoutInput) {
    this.checkouts.push(input)
    return { url: `https://checkout.stripe.test/${this.checkouts.length}` }
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
    }
    this.subscriptions.set(sub.id, sub)
    return sub
  }

  update(subscriptionId: string, change: Partial<BillingSubscription>) {
    const sub = this.subscriptions.get(subscriptionId)
    if (!sub) throw new Error(`No such subscription: ${subscriptionId}`)
    this.subscriptions.set(subscriptionId, { ...sub, ...change })
  }

  async getSubscription(subscriptionId: string) {
    const sub = this.subscriptions.get(subscriptionId)
    if (!sub) throw new Error(`No such subscription: ${subscriptionId}`)
    return { ...sub }
  }

  async setCancelAtPeriodEnd(subscriptionId: string, cancel: boolean) {
    const sub = await this.getSubscription(subscriptionId)
    if (sub.status === 'canceled') throw new Error('A canceled subscription cannot be changed')
    this.update(subscriptionId, { cancelAtPeriodEnd: cancel })
  }

  async listInvoices(customerId: string) {
    return this.invoices.get(customerId) ?? []
  }
}
