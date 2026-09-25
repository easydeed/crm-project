import { expect, test } from 'vitest'
import { FixtureListingProvider, FixturePropertyProvider } from '@/providers/fixture-providers'
import { callCostCents, withMetering, type ProviderCall } from '@/providers/metering'
import type { PropertyProvider } from '@/providers/types'
import type { CostRates } from '@/config/costs'

const RATES: CostRates = {
  effectiveDate: '2026-01-01',
  providerCallCents: { 'property:lookupParcel': 4 },
  sendCents: null,
  fixedMonthlyCents: { email: null, hosting: null },
}

class BillableProperty implements PropertyProvider {
  readonly billable = true
  async lookupParcel(query: { county: string; apn: string }) {
    if (query.apn === 'boom') throw new Error('vendor down')
    return null
  }
}

test('every call to a billable provider records one row, including a failed call', async () => {
  const calls: ProviderCall[] = []
  const provider = withMetering(new BillableProperty(), 'property', { accountId: 'acct-1', record: async (call) => void calls.push(call) })
  await provider.lookupParcel({ county: 'Los Angeles', apn: '1' })
  await provider.lookupParcel({ county: 'Los Angeles', apn: '2' })
  await expect(provider.lookupParcel({ county: 'Los Angeles', apn: 'boom' })).rejects.toThrow(/vendor down/)
  expect(calls).toEqual(Array(3).fill({ provider: 'property', operation: 'lookupParcel', accountId: 'acct-1', count: 1 }))
  expect(provider.billable).toBe(true)
})

test('fixtures are not billable and are never metered', async () => {
  const calls: ProviderCall[] = []
  const record = async (call: ProviderCall) => void calls.push(call)
  const property = new FixturePropertyProvider()
  const listing = new FixtureListingProvider()
  expect(withMetering(property, 'property', { record })).toBe(property)
  expect(withMetering(listing, 'listing', { record })).toBe(listing)
  await withMetering(property, 'property', { record }).lookupParcel({ county: 'Los Angeles', apn: 'none' })
  expect(calls).toHaveLength(0)
})

test('cost is the rate in force times the count, or null while the rate is not set', () => {
  expect(callCostCents({ provider: 'property', operation: 'lookupParcel', count: 3 }, RATES)).toBe(12)
  expect(callCostCents({ provider: 'listing', operation: 'listingsNear', count: 3 }, RATES)).toBeNull()
  expect(callCostCents({ provider: 'property', operation: 'lookupParcel', count: 1 })).toBeNull()
})
