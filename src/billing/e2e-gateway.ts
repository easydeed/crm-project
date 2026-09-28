import { FakeBillingGateway } from '@/billing/fake-gateway'

/** Stripe stand-in for local browser tests: the plan e2e-setup gives the seeded agent. */
export function e2eBillingGateway() {
  const gateway = new FakeBillingGateway()
  gateway.subscriptions.set('sub_e2e', {
    id: 'sub_e2e',
    customerId: 'cus_e2e',
    status: 'active',
    currentPeriodEnd: new Date('2099-01-01T00:00:00Z'),
    cancelAtPeriodEnd: false,
    accountId: null,
    cardLast4: '4242',
  })
  gateway.invoices.set('cus_e2e', [
    { id: 'in_e2e_2', created: new Date('2026-09-01T16:00:00Z'), amountCents: 1900, status: 'paid', url: null },
    { id: 'in_e2e_1', created: new Date('2026-08-01T16:00:00Z'), amountCents: 1900, status: 'paid', url: null },
  ])
  return gateway
}
