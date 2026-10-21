import { eq } from 'drizzle-orm'
import { demoBilling, demoCheckoutUrl } from '@/billing/demo-checkout'
import type { CheckoutInput } from '@/billing/gateway'
import { getRuntimeDb } from '@/db/runtime'
import { subscriptions } from '@/db/schema'
import { FakeBillingGateway } from '@/billing/fake-gateway'
import { E2E_AGENTS, E2E_PERIOD_END, E2E_PLAN_CENTS, stripeIds } from '@/db/fixtures/e2e-agents'

/**
 * Stripe stand-in for local browser tests: each e2e agent's plan and invoices (OR-044a). Built from
 * the agents table, so an agent with a subscription row always has a Stripe entry, unless the
 * table marks it missing (a 404) or unreachable (a failure to reach Stripe) on purpose.
 */
class E2EBillingGateway extends FakeBillingGateway {
  constructor(private readonly unreachable: Set<string>) {
    super()
  }

  override async getSubscription(subscriptionId: string) {
    if (this.unreachable.has(subscriptionId)) throw new Error(`Stripe GET /subscriptions/${subscriptionId} failed (503): e2e stand-in, unreachable on purpose`)
    if (demoBilling()) {
      const { db } = getRuntimeDb()
      const [row] = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubId, subscriptionId)).limit(1)
      if (row && (subscriptionId.startsWith('sub_demo_') || this.subscriptions.has(subscriptionId))) return { id: subscriptionId, customerId: row.stripeCustomerId!, status: row.status, currentPeriodEnd: row.currentPeriodEnd, cancelAtPeriodEnd: row.cancelAtPeriodEnd, accountId: row.accountId, cardLast4: '4242', monthlyCents: row.monthlyCents }
    }
    return super.getSubscription(subscriptionId)
  }
  override async createCheckoutSession(input: CheckoutInput) {
    return demoBilling() ? { url: demoCheckoutUrl(input) } : super.createCheckoutSession(input)
  }

  override async setCancelAtPeriodEnd(subscriptionId: string, cancel: boolean) {
    if (!demoBilling()) return super.setCancelAtPeriodEnd(subscriptionId, cancel)
    await this.getSubscription(subscriptionId)
    await getRuntimeDb().db.update(subscriptions).set({ cancelAtPeriodEnd: cancel }).where(eq(subscriptions.stripeSubId, subscriptionId))
  }

  override async setMonthlyTotal(subscriptionId: string, cents: number) {
    if (!demoBilling()) return super.setMonthlyTotal(subscriptionId, cents)
    await this.getSubscription(subscriptionId)
    await getRuntimeDb().db.update(subscriptions).set({ monthlyCents: cents }).where(eq(subscriptions.stripeSubId, subscriptionId))
  }

}

export function e2eBillingGateway() {
  const unreachable = new Set<string>()
  const gateway = new E2EBillingGateway(unreachable)
  for (const agent of E2E_AGENTS) {
    if (agent.billing.plan !== 'stripe') continue
    const { sub, customer } = stripeIds(agent)
    if (agent.billing.gateway === 'unreachable') unreachable.add(sub)
    if (agent.billing.gateway !== 'missing') {
      gateway.subscriptions.set(sub, {
        id: sub,
        customerId: customer,
        status: agent.billing.status,
        currentPeriodEnd: E2E_PERIOD_END,
        cancelAtPeriodEnd: agent.billing.cancelAtPeriodEnd ?? false,
        accountId: null,
        cardLast4: '4242',
      })
    }
    gateway.invoices.set(
      customer,
      agent.billing.invoices.map((invoice) => ({ id: invoice.id, created: new Date(invoice.created), amountCents: E2E_PLAN_CENTS, status: invoice.status, url: invoice.url })),
    )
  }
  return gateway
}
