import { expect, expectTypeOf, test } from 'vitest'
import { CA_TAX } from '@/config/ca-tax'
import { FixtureListingProvider } from '@/providers/fixture-providers'
import { AWKWARD, CLOSED_LISTING_AGENTS } from '@/providers/fixtures/closed-listings'
import type { ClosedListing } from '@/providers/types'

const provider = new FixtureListingProvider()

function isNewestFirst(rows: ClosedListing[]) {
  return rows.every((row, i) => i === 0 || rows[i - 1]!.closeDate >= row.closeDate)
}

test('the agent with 47 closings gets all 47, newest close first, across the six counties', async () => {
  const rows = await provider.closedByAgent(CLOSED_LISTING_AGENTS.many)
  expect(rows).toHaveLength(47)
  expect(isNewestFirst(rows)).toBe(true)
  expect(new Set(rows.map((row) => row.mlsId)).size).toBe(47)
  const cities = new Set(rows.map((row) => row.city))
  // Two cities per county in the corpus; every county is represented.
  expect(cities.size).toBe(CA_TAX.counties.length * 2)
})

test('the thin agent gets exactly three, in close-date order', async () => {
  const rows = await provider.closedByAgent(CLOSED_LISTING_AGENTS.thin)
  expect(rows.map((row) => [row.mlsId, row.closeDate])).toEqual([
    ['CR30001', '2025-02-07'],
    ['CR30003', '2022-08-29'],
    ['CR30002', '2019-05-14'],
  ])
})

test('an agent with no closings and an unknown id both return an empty array, never an error', async () => {
  await expect(provider.closedByAgent(CLOSED_LISTING_AGENTS.none)).resolves.toEqual([])
  await expect(provider.closedByAgent(CLOSED_LISTING_AGENTS.unknown)).resolves.toEqual([])
  await expect(provider.closedByAgent('')).resolves.toEqual([])
  // Object prototype names are unknown ids too, not a lookup that throws.
  for (const id of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    await expect(provider.closedByAgent(id)).resolves.toEqual([])
  }
})

test('a missing sqft or close price comes back null, not zero or empty', async () => {
  const rows = await provider.closedByAgent(CLOSED_LISTING_AGENTS.many)
  const noSqft = rows.find((row) => row.mlsId === AWKWARD.missingSqft.mlsId)!
  const noPrice = rows.find((row) => row.mlsId === AWKWARD.missingClosePrice.mlsId)!
  expect(noSqft.sqft).toBeNull()
  expect(noSqft.closePrice).toBe(845_000)
  expect(noPrice.closePrice).toBeNull()
  expect(noPrice.sqft).toBe(2_140)
})

test('two closings at the same address stay two rows, each at its own date', async () => {
  const rows = await provider.closedByAgent(CLOSED_LISTING_AGENTS.many)
  const same = rows.filter((row) => row.address === '77 Commonwealth Ave')
  expect(same.map((row) => [row.mlsId, row.closeDate])).toEqual([
    ['CR25004', '2024-11-21'],
    ['CR25003', '2017-03-10'],
  ])
})

test('a condo keeps its unit number in the address', async () => {
  const rows = await provider.closedByAgent(CLOSED_LISTING_AGENTS.many)
  const condo = rows.find((row) => row.mlsId === AWKWARD.condoWithUnit.mlsId)!
  expect(condo.address).toBe('2250 Foothill Blvd Unit 14')
  expect(condo.propertyType).toBe('Condominium')
})

test('every row carries its listing office and agent', async () => {
  for (const id of [CLOSED_LISTING_AGENTS.many, CLOSED_LISTING_AGENTS.thin]) {
    for (const row of await provider.closedByAgent(id)) {
      expect(row.listingOffice.trim()).not.toBe('')
      expect(row.listingAgent.trim()).not.toBe('')
    }
  }
})

test('a caller cannot reorder or edit the corpus through the result', async () => {
  const first = await provider.closedByAgent(CLOSED_LISTING_AGENTS.thin)
  first[0]!.address = 'changed'
  first.reverse()
  const again = await provider.closedByAgent(CLOSED_LISTING_AGENTS.thin)
  expect(again[0]).toMatchObject({ mlsId: 'CR30001', address: '905 Main St' })
})

// Checked by pnpm typecheck: MLS display rules need both attribution fields on every listing.
test('listingOffice and listingAgent are required strings, and missing values are null', () => {
  expectTypeOf<ClosedListing['listingOffice']>().toEqualTypeOf<string>()
  expectTypeOf<ClosedListing['listingAgent']>().toEqualTypeOf<string>()
  expectTypeOf<ClosedListing>().toHaveProperty('listingOffice')
  expectTypeOf<ClosedListing['sqft']>().toEqualTypeOf<number | null>()
  expectTypeOf<ClosedListing['closePrice']>().toEqualTypeOf<number | null>()
  expectTypeOf<ClosedListing['beds']>().toEqualTypeOf<number | null>()
  expectTypeOf<ClosedListing['baths']>().toEqualTypeOf<number | null>()

  const withoutOffice: Omit<ClosedListing, 'listingOffice'> = AWKWARD.condoWithUnit
  const withoutAgent: Omit<ClosedListing, 'listingAgent'> = AWKWARD.condoWithUnit
  // @ts-expect-error listingOffice is required
  const noOffice: ClosedListing = withoutOffice
  // @ts-expect-error listingAgent is required
  const noAgent: ClosedListing = withoutAgent
  expect([noOffice, noAgent]).toHaveLength(2)
})
