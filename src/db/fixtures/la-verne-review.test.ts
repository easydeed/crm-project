import { expect, test } from 'vitest'
import { reviewContacts, reviewParcels } from '@/db/fixtures/la-verne-review'
import { matchAddress } from '@/matching/match-address'

test('four review contacts need review with 2-3 candidates', () => {
  expect(reviewContacts).toHaveLength(4)
  const parcels = reviewParcels.map((parcel) => ({
    apn: parcel.apn,
    county: parcel.county,
    address: parcel.address,
    city: parcel.city,
    zip: parcel.zip,
  }))
  for (const contact of reviewContacts) {
    expect(contact.status).toBe('needs_review')
    const result = matchAddress(contact.addressRaw, parcels)
    expect(result.status, contact.name).toBe('needs_review')
    expect(result.candidates.length, contact.name).toBeGreaterThanOrEqual(2)
    expect(result.candidates.length, contact.name).toBeLessThanOrEqual(3)
  }
})
