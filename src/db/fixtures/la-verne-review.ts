import { streetNameNorm } from '@/matching/normalize'

function id(n: number) {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`
}

const refreshed = new Date('2026-08-01T00:00:00.000Z')

function reviewParcel(opts: {
  n: number
  apn: string
  address: string
  city: string
  zip: string
}) {
  return {
    id: id(opts.n),
    apn: opts.apn,
    county: 'Los Angeles' as const,
    address: opts.address,
    city: opts.city,
    zip: opts.zip,
    streetNameNorm: streetNameNorm(opts.address),
    lat: 34.102 + (opts.n - 50) * 0.0002,
    lng: -117.77 - (opts.n - 50) * 0.0002,
    beds: 3,
    baths: '2.0',
    sqft: 1600,
    yearBuilt: 1974,
    useCode: 'SFR',
    assessedValue: 480000,
    baseYear: 2018,
    baseYearValue: 420000,
    lastRefreshedAt: refreshed,
  }
}

export const reviewParcels = [
  reviewParcel({ n: 50, apn: '8374-020-010', address: '410 Ashford Ave', city: 'La Verne', zip: '91750' }),
  reviewParcel({ n: 51, apn: '8374-020-012', address: '412 Ashford Ave', city: 'La Verne', zip: '91750' }),
  reviewParcel({ n: 52, apn: '8374-021-100', address: '100 N Baseline Rd', city: 'La Verne', zip: '91750' }),
  reviewParcel({ n: 53, apn: '8374-021-101', address: '100 S Baseline Rd', city: 'La Verne', zip: '91750' }),
  reviewParcel({ n: 54, apn: '8374-022-800', address: '800 Bonita Ave', city: 'La Verne', zip: '91750' }),
  reviewParcel({ n: 55, apn: '8374-022-801', address: '800 Bonita Ave', city: 'Pomona', zip: '91750' }),
  reviewParcel({ n: 56, apn: '8374-023-015', address: '15 Oakdale Ave', city: 'La Verne', zip: '91750' }),
  reviewParcel({ n: 57, apn: '8374-023-016', address: '15 Oakdale Ct', city: 'La Verne', zip: '91750' }),
]

function reviewContact(opts: {
  n: number
  name: string
  email: string
  phone: string
  addressRaw: string
}) {
  return {
    id: id(opts.n),
    name: opts.name,
    email: opts.email,
    phone: opts.phone,
    addressRaw: opts.addressRaw,
    parcelId: null,
    closeDate: '2023-04-15',
    notes: null,
    status: 'needs_review' as const,
  }
}

function reviewEvent(opts: {
  n: number
  parcelN: number
  kind: string
  docNumber: string
  recordedAt: string
  party: string
}) {
  return {
    id: id(opts.n),
    parcelId: id(opts.parcelN),
    county: 'Los Angeles' as const,
    kind: opts.kind,
    docNumber: opts.docNumber,
    recordedAt: opts.recordedAt,
    amount: 625000,
    party: opts.party,
    raw: { source: 'la-verne-review' },
  }
}

export const reviewParcelEvents = [
  reviewEvent({
    n: 450,
    parcelN: 50,
    kind: 'grant_deed',
    docNumber: '2015040101',
    recordedAt: '2015-04-01',
    party: 'James Whitaker',
  }),
  reviewEvent({
    n: 451,
    parcelN: 50,
    kind: 'grant_deed',
    docNumber: '2023011501',
    recordedAt: '2023-01-15',
    party: 'Anita Flores',
  }),
  reviewEvent({
    n: 452,
    parcelN: 51,
    kind: 'grant_deed',
    docNumber: '2018040201',
    recordedAt: '2018-04-02',
    party: 'Robert Chen',
  }),
]

export const reviewContacts = [
  reviewContact({
    n: 203,
    name: 'Anita Flores',
    email: 'anita.flores@example.com',
    phone: '909-555-0203',
    addressRaw: '411 Ashford Ave, La Verne, CA 91750',
  }),
  reviewContact({
    n: 204,
    name: 'Greg Walsh',
    email: 'greg.walsh@example.com',
    phone: '909-555-0204',
    addressRaw: '100 Baseline Rd, La Verne, CA 91750',
  }),
  reviewContact({
    n: 205,
    name: 'Mei Lin',
    email: 'mei.lin@example.com',
    phone: '909-555-0205',
    addressRaw: '800 Bonita Ave, La Verne, CA 91750',
  }),
  reviewContact({
    n: 206,
    name: 'Darryl Stone',
    email: 'darryl.stone@example.com',
    phone: '909-555-0206',
    addressRaw: '15 Oakdale, La Verne, CA 91750',
  }),
]
