import type { mlsListings, parcels } from '@/db/schema'

/** What a property data source returns: a parcel row ready to write, without our id. */
export type ParcelRecord = Omit<typeof parcels.$inferInsert, 'id'>
export type ListingRecord = Omit<typeof mlsListings.$inferInsert, 'id'>

type Provider = {
  /** False for fixtures. A non-billable provider is never metered, so fixtures cost nothing. */
  readonly billable: boolean
}

/** County assessor and recorder data. Every call goes through withMetering. */
export interface PropertyProvider extends Provider {
  lookupParcel(query: { county: string; apn: string }): Promise<ParcelRecord | null>
}

/** MLS listings. Every call goes through withMetering. */
export interface ListingProvider extends Provider {
  listingsNear(query: { zip: string }): Promise<ListingRecord[]>
}
