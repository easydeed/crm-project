import { buildLaVerneFixtures } from '@/db/fixtures/la-verne'
import { CLOSED_LISTINGS } from '@/providers/fixtures/closed-listings'
import type { ClosedListing, ListingProvider, ParcelRecord, PropertyProvider } from '@/providers/types'

/** Captured La Verne records. Not billable: each call is recorded in provider_calls at zero cost. */
export class FixturePropertyProvider implements PropertyProvider {
  readonly billable = false

  async lookupParcel(query: { county: string; apn: string }): Promise<ParcelRecord | null> {
    const found = buildLaVerneFixtures().parcels.find((parcel) => parcel.county === query.county && parcel.apn === query.apn)
    if (!found) return null
    const record: ParcelRecord & { id?: string } = { ...found }
    delete record.id
    return record
  }
}

/** Newest close first; the same day falls back to the MLS id, so the order never wobbles. */
export function newestCloseFirst(a: ClosedListing, b: ClosedListing): number {
  return b.closeDate.localeCompare(a.closeDate) || a.mlsId.localeCompare(b.mlsId)
}

/** No nearby MLS listings are captured yet. Closed listings come from the fixture corpus. */
export class FixtureListingProvider implements ListingProvider {
  readonly billable = false

  async listingsNear(): Promise<[]> {
    return []
  }

  async closedByAgent(agentId: string): Promise<ClosedListing[]> {
    // Own keys only: an id like "constructor" is unknown, not a prototype method.
    const rows = Object.hasOwn(CLOSED_LISTINGS, agentId) ? CLOSED_LISTINGS[agentId]! : []
    return rows.map((row) => ({ ...row, sqft: row.sqft ?? 0 })).sort(newestCloseFirst)
  }
}
