import { afterEach, expect, test, vi } from 'vitest'
import { StripeGateway, toSubscription } from '@/billing/stripe-gateway'
import { PLAN, ADDON_PRICES } from '@/config/costs'
import { TEXT_CALL_LIST_KEY as KEY } from '@/addons/text-call-list'

const env = { ...process.env }
afterEach(() => { vi.unstubAllGlobals(); process.env = { ...env } })

test('OR-056 writes price and paid entitlement in the same Stripe request, including empty keys', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_or056_mock_only'
  const sub = { id: 'sub_test', items: { data: [{ id: 'si_test', quantity: 1, price: { unit_amount: PLAN.priceCents, currency: 'usd', product: 'prod_test', recurring: { interval: 'month' } } }] } }
  const fetcher = vi.fn(async () => Response.json(sub))
  vi.stubGlobal('fetch', fetcher)
  const gateway = new StripeGateway()
  const total = PLAN.priceCents + ADDON_PRICES.cents[KEY]
  await gateway.setMonthlyTotal('sub_test', total, [KEY])
  await gateway.setMonthlyTotal('sub_test', PLAN.priceCents, [])
  const posts = fetcher.mock.calls.map((call) => call as unknown as [string, RequestInit]).filter(([, init]) => init.method === 'POST')
  expect(posts).toHaveLength(2)
  const first = new URLSearchParams(String(posts[0][1].body)), last = new URLSearchParams(String(posts[1][1].body))
  expect(first.get('items[0][price_data][unit_amount]')).toBe(String(total))
  expect(first.get('metadata[addon_keys]')).toBe(JSON.stringify([KEY]))
  expect(first.get('proration_behavior')).toBe('none')
  expect(last.get('items[0][price_data][unit_amount]')).toBe(String(PLAN.priceCents))
  expect(last.get('metadata[addon_keys]')).toBe('[]')
})

test('OR-056 parses canonical empty entitlement and rejects malformed metadata', () => {
  expect(toSubscription({ metadata: { addon_keys: '[]' } }).addonKeys).toEqual([])
  expect(toSubscription({ metadata: { addon_keys: JSON.stringify([KEY]) } }).addonKeys).toEqual([KEY])
  expect(() => toSubscription({ metadata: { addon_keys: 'not-json' } })).toThrow()
  expect(() => toSubscription({ metadata: { addon_keys: '[false]' } })).toThrow()
  expect(() => toSubscription({ metadata: { addon_keys: JSON.stringify([KEY, KEY]) } })).toThrow()
})

test('OR-056 sends the frozen quote and expiry with checkout subscription metadata', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_or056_mock_only'; process.env.STRIPE_PRICE_ID = 'price_test'
  const fetcher = vi.fn(async (url: string) => Response.json(url.includes('/prices/') ? { unit_amount: PLAN.priceCents, product: 'prod_test' } : { id: 'cs_test', url: 'https://checkout.stripe.test/cs_test' }))
  vi.stubGlobal('fetch', fetcher)
  const input = { accountId: 'account_test', email: 'agent@example.com', customerId: null, successUrl: 'https://onrecord.example/app', cancelUrl: 'https://onrecord.example/billing', monthlyCents: PLAN.priceCents, addonKeys: [] as string[], expiresAt: 2000000000 }
  expect(await new StripeGateway().createCheckoutSession(input)).toMatchObject({ id: 'cs_test' })
  const calls = fetcher.mock.calls as unknown as [string, RequestInit][]
  const params = new URLSearchParams(String(calls.at(-1)![1].body))
  expect(params.get('subscription_data[metadata][addon_keys]')).toBe('[]')
  expect(params.get('subscription_data[metadata][account_id]')).toBe(input.accountId)
  expect(params.get('expires_at')).toBe(String(input.expiresAt))
})
