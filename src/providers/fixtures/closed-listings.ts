import { CA_TAX } from '@/config/ca-tax'
import type { ClosedListing } from '@/providers/types'

/**
 * Closed listings by MLS agent id, shaped like the documented SimplyRETS response after
 * mapping. Rows are stored out of date order on purpose: the provider sorts, not the data.
 *
 * Nobody has run SimplyRETS `?agent={id}&status=Closed` against a live feed. These ids are
 * MLS handles in the documented shape, not captured from a real account.
 */
export const CLOSED_LISTING_AGENTS = {
  /** 47 closings across the six counties, with every awkward row below mixed in. */
  many: 'CRMLS-P4700',
  /** The thin case. */
  thin: 'CRMLS-P0300',
  /** Known to the MLS, closed nothing: the usual buyer's agent. */
  none: 'CRMLS-P0000',
  /** Not an id the MLS knows. */
  unknown: 'CRMLS-P9999',
} as const

const OFFICE = 'Coastline Realty'
const AGENT = 'Priya Raman'

/** One city per county, in the same order as CA_TAX.counties. */
const CITIES: Record<(typeof CA_TAX.counties)[number], { city: string; zip: string }[]> = {
  'Los Angeles': [{ city: 'La Verne', zip: '91750' }, { city: 'Claremont', zip: '91711' }],
  Orange: [{ city: 'Fullerton', zip: '92831' }, { city: 'Brea', zip: '92821' }],
  Ventura: [{ city: 'Ventura', zip: '93001' }, { city: 'Ojai', zip: '93023' }],
  'San Diego': [{ city: 'Oceanside', zip: '92054' }, { city: 'Escondido', zip: '92025' }],
  Riverside: [{ city: 'Corona', zip: '92882' }, { city: 'Norco', zip: '92860' }],
  'San Bernardino': [{ city: 'Upland', zip: '91786' }, { city: 'Redlands', zip: '92373' }],
}

const STREETS = ['Oakdale Ave', 'Bonita Ave', 'Foothill Blvd', 'Main St', 'Commonwealth Ave', 'Arrow Hwy', 'Baseline Rd']

function listing(row: Omit<ClosedListing, 'listingOffice' | 'listingAgent'>): ClosedListing {
  return { ...row, listingOffice: OFFICE, listingAgent: AGENT }
}

/** 42 ordinary closings, deterministic, spread across the six counties and ten years. */
function ordinaryClosings(): ClosedListing[] {
  const counties = CA_TAX.counties
  return Array.from({ length: 42 }, (_, i) => {
    const place = CITIES[counties[i % counties.length]!][Math.floor(i / counties.length) % 2]!
    const year = 2016 + ((i * 7) % 10)
    const month = ((i * 5) % 12) + 1
    const day = ((i * 3) % 27) + 1
    return listing({
      mlsId: `CR${String(24_100 + i)}`,
      address: `${1100 + i * 12} ${STREETS[i % STREETS.length]}`,
      city: place.city,
      zip: place.zip,
      closeDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      closePrice: 610_000 + i * 17_500,
      beds: 2 + (i % 4),
      baths: 1 + (i % 3),
      sqft: 1_150 + i * 35,
      propertyType: 'Residential',
    })
  })
}

/** The rows a real feed will throw at the signup flow. */
export const AWKWARD = {
  missingSqft: listing({
    mlsId: 'CR25001', address: '1840 Oakdale Ave', city: 'La Verne', zip: '91750', closeDate: '2023-04-18',
    closePrice: 845_000, beds: 3, baths: 2, sqft: null, propertyType: 'Residential',
  }),
  missingClosePrice: listing({
    mlsId: 'CR25002', address: '412 Bonita Ave', city: 'Claremont', zip: '91711', closeDate: '2021-09-02',
    closePrice: null, beds: 4, baths: 3, sqft: 2_140, propertyType: 'Residential',
  }),
  sameAddressEarlier: listing({
    mlsId: 'CR25003', address: '77 Commonwealth Ave', city: 'Fullerton', zip: '92831', closeDate: '2017-03-10',
    closePrice: 598_000, beds: 3, baths: 2, sqft: 1_420, propertyType: 'Residential',
  }),
  sameAddressLater: listing({
    mlsId: 'CR25004', address: '77 Commonwealth Ave', city: 'Fullerton', zip: '92831', closeDate: '2024-11-21',
    closePrice: 912_000, beds: 3, baths: 2, sqft: 1_420, propertyType: 'Residential',
  }),
  condoWithUnit: listing({
    mlsId: 'CR25005', address: '2250 Foothill Blvd Unit 14', city: 'Upland', zip: '91786', closeDate: '2025-06-30',
    closePrice: 489_000, beds: 2, baths: 2, sqft: 1_060, propertyType: 'Condominium',
  }),
} as const

const MANY: ClosedListing[] = (() => {
  const rows = ordinaryClosings()
  // Mixed in at scattered positions, not appended in order.
  rows.splice(3, 0, AWKWARD.sameAddressEarlier)
  rows.splice(9, 0, AWKWARD.condoWithUnit)
  rows.splice(17, 0, AWKWARD.missingSqft)
  rows.splice(26, 0, AWKWARD.sameAddressLater)
  rows.splice(38, 0, AWKWARD.missingClosePrice)
  return rows
})()

const THIN: ClosedListing[] = [
  { mlsId: 'CR30002', address: '19 Arrow Hwy', city: 'Norco', zip: '92860', closeDate: '2019-05-14', closePrice: 702_000, beds: 4, baths: 2, sqft: 1_880, propertyType: 'Residential', listingOffice: 'Hill Realty', listingAgent: 'Sam Ortiz' },
  { mlsId: 'CR30001', address: '905 Main St', city: 'Ventura', zip: '93001', closeDate: '2025-02-07', closePrice: 1_015_000, beds: 3, baths: 2, sqft: 1_610, propertyType: 'Residential', listingOffice: 'Hill Realty', listingAgent: 'Sam Ortiz' },
  { mlsId: 'CR30003', address: '48 Baseline Rd', city: 'Redlands', zip: '92373', closeDate: '2022-08-29', closePrice: 655_000, beds: 3, baths: 2, sqft: 1_390, propertyType: 'Residential', listingOffice: 'Hill Realty', listingAgent: 'Sam Ortiz' },
]

/** Keyed by agent id. The unknown id is deliberately absent. */
export const CLOSED_LISTINGS: Readonly<Record<string, readonly ClosedListing[]>> = {
  [CLOSED_LISTING_AGENTS.many]: MANY,
  [CLOSED_LISTING_AGENTS.thin]: THIN,
  [CLOSED_LISTING_AGENTS.none]: [],
}
