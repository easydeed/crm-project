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

/**
 * One sale an agent closed, as the MLS reports it. A value the feed leaves out is null:
 * never defaulted to zero or an empty string, so "we don't know" stays distinct from a
 * real zero all the way to the page.
 *
 * listingOffice and listingAgent are required: MLS display rules need both wherever a
 * listing is shown, so nothing on the way to a page may drop them.
 */
export type ClosedListing = {
  mlsId: string
  /** Street address, with any unit number as the feed gives it. */
  address: string
  city: string
  zip: string
  /** ISO date, YYYY-MM-DD. */
  closeDate: string
  closePrice: number | null
  beds: number | null
  baths: number | null
  sqft: number | null
  propertyType: string
  listingOffice: string
  listingAgent: string
}

/** MLS listings. Every call goes through withMetering. */
export interface ListingProvider extends Provider {
  listingsNear(query: { zip: string }): Promise<ListingRecord[]>
  /**
   * Every closed listing for an MLS agent id, newest close first. Any paging is internal:
   * callers always get the full list. An id with no closings, or one the MLS does not
   * know, returns an empty array. Empty is the usual answer for a buyer's agent, not an
   * error.
   */
  closedByAgent(agentId: string): Promise<ClosedListing[]>
}
