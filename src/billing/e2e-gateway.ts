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
    return super.getSubscription(subscriptionId)
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
