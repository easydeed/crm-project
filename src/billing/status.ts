/** The cached subscription, as the send gate and the dashboard read it. Null means the account never subscribed. */
export type BillingState = {
  status: string
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
} | null

export type BillingIssue = 'no_subscription' | 'past_due' | 'canceled' | 'inactive'

/**
 * Only an active subscription sends. One set to cancel keeps sending until its period
 * ends, and stops at that moment even if Stripe's final webhook is late.
 */
export function billingIssue(state: BillingState, now: Date): BillingIssue | null {
  if (!state) return 'no_subscription'
  if (state.status === 'past_due') return 'past_due'
  if (state.status === 'canceled') return 'canceled'
  if (state.status !== 'active') return 'inactive'
  if (state.cancelAtPeriodEnd && state.currentPeriodEnd && now >= state.currentPeriodEnd) return 'canceled'
  return null
}

export function billingAllowsSending(state: BillingState, now: Date): boolean {
  return billingIssue(state, now) === null
}
