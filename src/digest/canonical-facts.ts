import { streetMedianSale } from '@/digest/blocks/taxes'
import { scenarios } from '@/digest/fixtures/scenarios'
import { formatAboutMoney, formatMoney, roundToHundred } from '@/digest/format'
import { renderDigest } from '@/digest/render'

export function fullScenario() {
  const row = scenarios.find((scenario) => scenario.name === 'full')
  if (!row) throw new Error('missing full scenario')
  return row
}

export type CanonicalFacts = ReturnType<typeof canonicalFacts>

export function canonicalFacts() {
  const { input } = fullScenario()
  const median = streetMedianSale(input.parcel, input.streetSales, input.asOf)
  const assessed = input.parcel.assessedValue
  if (median == null || assessed == null) {
    throw new Error('full scenario is missing tax inputs')
  }
  const benefit = roundToHundred((median - assessed) * input.tax.defaultTaxRatePct)
  const listing = input.nearbyListing
  if (!listing) throw new Error('full scenario is missing the listing')
  return {
    firstName: input.contact.firstName,
    address: input.parcel.address,
    city: input.parcel.city,
    zip: input.parcel.zip,
    owner: input.events[0]?.party ?? input.contact.firstName,
    streetMedian: formatAboutMoney(median),
    taxedOn: formatMoney(assessed),
    benefit: formatAboutMoney(benefit),
    listingAddress: listing.address,
    listingPrice: listing.listPrice != null ? formatMoney(listing.listPrice) : null,
  }
}

export function fullDigest() {
  return renderDigest(fullScenario().input)
}
