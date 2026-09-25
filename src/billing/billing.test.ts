import { readFileSync } from 'node:fs'
import { afterEach, expect, test } from 'vitest'
import { signStripePayload, verifyStripeSignature } from '@/billing/signature'
import { billingAllowsSending, billingIssue } from '@/billing/status'
import { stripeSecretKey, toSubscription } from '@/billing/stripe-gateway'
import { assertSendAllowed } from '@/jobs/send-guard'

const NOW = new Date('2026-10-01T12:00:00Z')
const LATER = new Date('2026-10-20T00:00:00Z')
const env = { ...process.env }
afterEach(() => {
  process.env = { ...env }
})

const active = { status: 'active', currentPeriodEnd: LATER, cancelAtPeriodEnd: false }

test('assertSendAllowed throws for an account without an active subscription', () => {
  process.env.SEND_ENABLED = 'true'
  process.env.SEND_ALLOWLIST = 'example.com'
  const ctx = { recipientEmail: 'a@example.com', unsubscribed: false, suppressed: false, accountPaused: false }
  for (const state of [null, { ...active, status: 'past_due' }, { ...active, status: 'canceled' }, { ...active, status: 'incomplete' }]) {
    expect(() => assertSendAllowed({ ...ctx, billingActive: billingAllowsSending(state, NOW) })).toThrow(/no active subscription/)
  }
  expect(() => assertSendAllowed({ ...ctx, billingActive: billingAllowsSending(active, NOW) })).not.toThrow()
})

test('a subscription set to cancel sends until its period ends, then stops', () => {
  const canceling = { ...active, cancelAtPeriodEnd: true }
  expect(billingIssue(canceling, NOW)).toBeNull()
  expect(billingIssue(canceling, new Date(LATER.getTime() - 1))).toBeNull()
  expect(billingIssue(canceling, LATER)).toBe('canceled')
  expect(billingIssue(active, new Date('2027-01-01T00:00:00Z'))).toBeNull()
})

test('billing issues are named for the dashboard', () => {
  expect(billingIssue(null, NOW)).toBe('no_subscription')
  expect(billingIssue({ ...active, status: 'past_due' }, NOW)).toBe('past_due')
  expect(billingIssue({ ...active, status: 'canceled' }, NOW)).toBe('canceled')
  expect(billingIssue({ ...active, status: 'unpaid' }, NOW)).toBe('inactive')
})

test('the send job and the scheduler both read billing for the guard', () => {
  const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
  expect(read('jobs/send-job.ts')).toContain('billingActive: billingAllowsSending(billing, ctx.now)')
  expect(read('jobs/schedule.ts')).toContain('row.paused || !billingAllowsSending(billing, now)')
})

test('a Stripe signature verifies only for the exact body, secret, and a recent time', () => {
  const body = JSON.stringify({ id: 'evt_1', type: 'customer.subscription.updated' })
  const header = signStripePayload(body, 'whsec_test', NOW)
  expect(verifyStripeSignature(body, header, 'whsec_test', NOW)).toBe(true)
  expect(verifyStripeSignature(`${body} `, header, 'whsec_test', NOW)).toBe(false)
  expect(verifyStripeSignature(body, header, 'whsec_other', NOW)).toBe(false)
  expect(verifyStripeSignature(body, header, 'whsec_test', new Date(NOW.getTime() + 301_000))).toBe(false)
  expect(verifyStripeSignature(body, null, 'whsec_test', NOW)).toBe(false)
  expect(verifyStripeSignature(body, 't=abc,v1=00', 'whsec_test', NOW)).toBe(false)
  expect(verifyStripeSignature(body, header, '', NOW)).toBe(false)
})

test('only a Stripe test key is accepted', () => {
  process.env.STRIPE_SECRET_KEY = ''
  expect(() => stripeSecretKey()).toThrow(/not configured/)
  process.env.STRIPE_SECRET_KEY = 'rk_something'
  expect(() => stripeSecretKey()).toThrow(/test mode only/)
  process.env.STRIPE_SECRET_KEY = 'sk_test_abc'
  expect(stripeSecretKey()).toBe('sk_test_abc')
})

test('the subscription period end is read from either API shape', () => {
  const end = Math.floor(LATER.getTime() / 1000)
  const old = toSubscription({ id: 'sub_1', customer: 'cus_1', status: 'active', current_period_end: end, metadata: { account_id: 'a' } })
  const basil = toSubscription({
    id: 'sub_1', customer: { id: 'cus_1' }, status: 'active', cancel_at_period_end: true,
    items: { data: [{ current_period_end: end }] }, default_payment_method: { card: { last4: '4242' } },
  })
  expect(old).toMatchObject({ customerId: 'cus_1', currentPeriodEnd: LATER, accountId: 'a', cancelAtPeriodEnd: false })
  expect(basil).toMatchObject({ customerId: 'cus_1', currentPeriodEnd: LATER, cancelAtPeriodEnd: true, cardLast4: '4242' })
})
