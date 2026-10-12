import { expect, test } from 'vitest'
import { e2eBillingGateway } from '@/billing/e2e-gateway'
import { SubscriptionNotFound } from '@/billing/gateway'
import { E2E_AGENTS, stripeIds } from '@/db/fixtures/e2e-agents'

/**
 * OR-044a. The quiet agent's billing page threw because e2e setup wrote a subscription the Stripe
 * stand-in had never heard of. Both now come from one table: every agent with a subscription row
 * has a Stripe entry, unless the table says missing or unreachable, and then it fails the way it says.
 */
test('the e2e Stripe stand-in knows every subscription e2e setup writes, except the two that fail on purpose', async () => {
  const gateway = e2eBillingGateway()
  const subscribed = E2E_AGENTS.filter((row) => row.billing.plan === 'stripe')
  expect(subscribed.length).toBeGreaterThan(5)
  const failures: Record<string, string[]> = { missing: [], unreachable: [] }
  for (const row of subscribed) {
    if (row.billing.plan !== 'stripe') continue
    const { sub } = stripeIds(row)
    const result = await gateway.getSubscription(sub).then(
      (found) => ({ ok: true as const, status: found.status, cancelAtPeriodEnd: found.cancelAtPeriodEnd }),
      (error: unknown) => ({ ok: false as const, error }),
    )
    if (row.billing.gateway === 'known') {
      expect(result, row.key).toMatchObject({ ok: true, status: row.billing.status, cancelAtPeriodEnd: row.billing.cancelAtPeriodEnd ?? false })
    } else {
      expect(result.ok, row.key).toBe(false)
      const error = (result as { error: unknown }).error
      if (row.billing.gateway === 'missing') expect(error, row.key).toBeInstanceOf(SubscriptionNotFound)
      else expect(error, row.key).not.toBeInstanceOf(SubscriptionNotFound)
      failures[row.billing.gateway]!.push(row.key)
    }
  }
  expect(failures).toEqual({ missing: ['missing'], unreachable: ['unreachable'] })
})
