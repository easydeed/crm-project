import { formatDollars, PLAN } from '@/config/costs'

export const PLAN_LINE = `${formatDollars(PLAN.priceCents)} a month, up to ${PLAN.contactLimit} homeowners`

/** The cancel screen, word for word. Nothing else is offered there. */
export function cancelSentence(endDate: string) {
  return `Your homeowners stop getting the monthly note after ${endDate}. Your people and their matches stay here. Come back any time.`
}

export const NOTICES: Record<string, string> = {
  'done=canceled': 'Your plan is set to end. Nothing changes until then.',
  'done=resumed': 'Your plan will keep going. Nothing else changed.',
  'checkout=done': 'Thanks. Your plan starts as soon as Stripe confirms the payment, usually within a minute.',
  'error=checkout': 'We could not open checkout. Try again in a minute.',
  'error=cancel': 'We could not cancel your plan. Try again in a minute; nothing changed.',
  'error=resume': 'We could not resume your plan. Try again in a minute; nothing changed.',
}

export function statusWords(status: string, cancelAtPeriodEnd: boolean) {
  if (status === 'active') return cancelAtPeriodEnd ? 'Active until the end of this period' : 'Active'
  if (status === 'past_due') return 'Payment failed'
  if (status === 'canceled') return 'Ended'
  return 'Not active'
}

export function formatBillingDate(value: Date, timezone: string | null) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || 'America/Los_Angeles',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(value)
}
