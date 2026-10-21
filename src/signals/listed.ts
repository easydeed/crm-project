import { withinTrailingDays } from '@/digest/format'
import { sameHouse, nearbyHouse } from '@/matching/normalize'
import type { Signal, SignalContact, SignalInput } from '@/signals/types'

export function listingSignal(contact: SignalContact, input: SignalInput): Signal | null {
  const home = contact.parcel
  if (contact.status !== 'matched' || !home) return null
  const listings = (input.listings ?? []).filter((row) => row.zip === home.zip && row.status.toLowerCase() === 'active' && row.listDate && withinTrailingDays(row.listDate, input.asOf, 45))
  const own = listings.find((row) => sameHouse(row.address, home.address))
  const nearby = listings.find((row) => nearbyHouse(row.address, home.address))
  const listing = own ?? nearby
  if (!listing) return null
  return {
    contactId: contact.id, kind: own ? 'home_listed' : 'listed_nearby',
    detail: `${own ? 'Their house' : `A house at ${listing.address}`} is ${listing.status.toLowerCase()} in the MLS, listed ${listing.listDate}.`,
    score: own ? 1000 : 500, asOf: input.asOf, listingId: listing.id,
  }
}
