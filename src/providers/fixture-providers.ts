import { buildLaVerneFixtures } from '@/db/fixtures/la-verne'
import type { ListingProvider, ParcelRecord, PropertyProvider } from '@/providers/types'

/** Captured La Verne records. Not billable: nothing is recorded in provider_calls. */
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

/** No MLS listings are captured yet, so the fixture returns none. */
export class FixtureListingProvider implements ListingProvider {
  readonly billable = false

  async listingsNear(): Promise<[]> {
    return []
  }
}
