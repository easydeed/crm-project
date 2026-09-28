import type { BillingGateway } from '@/billing/gateway'
import { e2eBillingGateway } from '@/billing/e2e-gateway'
import { StripeGateway } from '@/billing/stripe-gateway'
import { isLocalE2E } from '@/config/e2e'

// A local browser test never reaches Stripe; see isLocalE2E for why a flag alone cannot do this.
let current: BillingGateway = isLocalE2E() ? e2eBillingGateway() : new StripeGateway()

export function getBillingGateway(): BillingGateway {
  return current
}

/** Tests install a FakeBillingGateway here. Production keeps StripeGateway. */
export function setBillingGateway(next: BillingGateway) {
  current = next
}
