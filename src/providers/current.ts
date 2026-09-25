import { FixtureListingProvider, FixturePropertyProvider } from '@/providers/fixture-providers'
import { withMetering } from '@/providers/metering'
import type { ListingProvider, PropertyProvider } from '@/providers/types'

let property: PropertyProvider = new FixturePropertyProvider()
let listing: ListingProvider = new FixtureListingProvider()

/**
 * The only way to reach a data provider. The result is metered, so a real provider
 * wired in later fills /admin/costs with no further work.
 */
export function getPropertyProvider(accountId: string | null = null): PropertyProvider {
  return withMetering(property, 'property', { accountId })
}

export function getListingProvider(accountId: string | null = null): ListingProvider {
  return withMetering(listing, 'listing', { accountId })
}

/** Tests install a billable fake here. Production keeps the fixtures until real data is wired. */
export function setProviders(next: { property?: PropertyProvider; listing?: ListingProvider }) {
  if (next.property) property = next.property
  if (next.listing) listing = next.listing
}
