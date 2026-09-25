import type { BillingGateway } from '@/billing/gateway'
import { StripeGateway } from '@/billing/stripe-gateway'

let current: BillingGateway = new StripeGateway()

export function getBillingGateway(): BillingGateway {
  return current
}

/** Tests install a FakeBillingGateway here. Production keeps StripeGateway. */
export function setBillingGateway(next: BillingGateway) {
  current = next
}
