import { CA_TAX } from '@/config/ca-tax'
import {
  reviewContacts,
  reviewParcelEvents,
  reviewParcels,
} from '@/db/fixtures/la-verne-review'
import { streetNameNorm } from '@/matching/normalize'

export const AGENT_ID = '00000000-0000-4000-8000-000000000001'

export const agent = {
  id: AGENT_ID,
  email: 'dana@coastline.example',
  passwordHash: '!seed-only-not-a-login-hash',
  name: 'Dana Whitfield',
  brokerage: 'Coastline Realty',
  dre: '01998432',
  phone: '909-555-0147',
  role: 'agent' as const,
  accentColor: '#1f4d3a',
  sendDay: 1,
  timezone: 'America/Los_Angeles',
  paused: false,
  mlsAgentId: 'C01998432',
}

type County = (typeof CA_TAX.counties)[number]

const COUNTY_META: Record<
  County,
  { city: string; zip: string; lat: number; lng: number; street: string }
> = {
  'Los Angeles': { city: 'La Verne', zip: '91750', lat: 34.1008, lng: -117.7678, street: 'Bonita Ave' },
  Orange: { city: 'Fullerton', zip: '92831', lat: 33.8704, lng: -117.9242, street: 'Commonwealth Ave' },
  Ventura: { city: 'Ventura', zip: '93001', lat: 34.2746, lng: -119.229, street: 'Main St' },
  'San Diego': { city: 'Oceanside', zip: '92054', lat: 33.1959, lng: -117.3795, street: 'Coast Hwy' },
  Riverside: { city: 'Corona', zip: '92882', lat: 33.8753, lng: -117.5664, street: 'Main St' },
  'San Bernardino': { city: 'Upland', zip: '91786', lat: 34.0975, lng: -117.6484, street: 'Arrow Hwy' },
}

function id(n: number) {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`
}

const MATCHED_NAMES = [
  'Maya Chen',
  'Luis Ortega',
  'Elena Vasquez',
  'James Kim',
  'Rosa Haddad',
  'Ken Nakamura',
  'Aisha Rahman',
  'Peter Walsh',
  'Sofia Alvarez',
  'Owen Briggs',
  'Nina Patel',
  'Carlos Mendez',
  'Hannah Brooks',
  'Diego Flores',
  'Grace Liu',
  'Marcus Hale',
  'Teresa Nguyen',
  'Andre Cole',
  'Fatima Noor',
  'Ryan Keller',
  'Leah Ortiz',
  'Jonah Price',
  'Camila Ruiz',
  'Ethan Shaw',
  'Nora Blake',
  'Victor Tran',
  'Isabel Mora',
  'Ben Carter',
  'Amelia Cho',
  'Chris Dalton',
  'Yara Hassan',
  'Nate Young',
  'Olivia Grant',
  'Paul Singh',
  'Quinn Adler',
  'Rita Gomez',
  'Sean Murphy',
  'Tina Brooks',
  'Uma Sharma',
  'Vince Park',
  'Wendy Hall',
  'Xavier Diaz',
  'Yuki Tanaka',
  'Zoe Mitchell',
] as const

export const unmatchedContacts = [
  {
    id: id(200),
    name: 'Helen Cho',
    email: 'helen.cho@example.com',
    phone: '909-555-0101',
    addressRaw: 'PO Box 312, La Verne, CA 91750',
    parcelId: null,
    closeDate: '2021-06-18',
    notes: null,
    status: 'no_parcel' as const,
  },
  {
    id: id(201),
    name: 'Samir Qureshi',
    email: 'samir.qureshi@example.com',
    phone: '909-555-0102',
    addressRaw: 'Baseline near White, La Verne CA',
    parcelId: null,
    closeDate: '2022-03-09',
    notes: null,
    status: 'needs_review' as const,
  },
  {
    id: id(202),
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    phone: '909-555-0103',
    addressRaw: 'unit behind 400 Bonita Ave',
    parcelId: null,
    closeDate: '2020-11-02',
    notes: null,
    status: 'needs_review' as const,
  },
]

export const oakdaleSales = [
  {
    house: 1840,
    apn: '8374-012-001',
    amount: 875000,
    docNumber: '2024051234',
    recordedAt: '2024-05-14',
    party: 'Maya Chen',
  },
  {
    house: 1852,
    apn: '8374-012-002',
    amount: 910000,
    docNumber: '2024110888',
    recordedAt: '2024-11-08',
    party: 'Luis Ortega',
  },
  {
    house: 1866,
    apn: '8374-012-003',
    amount: 799000,
    docNumber: '2025032101',
    recordedAt: '2025-03-21',
    party: 'Elena Vasquez',
  },
]

export function buildLaVerneFixtures() {
  const parcels: Array<{
    id: string
    apn: string
    county: County
    address: string
    city: string
    zip: string
    streetNameNorm: string
    lat: number
    lng: number
    beds: number
    baths: string
    sqft: number
    yearBuilt: number
    useCode: string
    assessedValue: number
    baseYear: number
    baseYearValue: number
    lastRefreshedAt: Date
  }> = []

  const contacts: Array<{
    id: string
    name: string
    email: string
    phone: string
    addressRaw: string
    parcelId: string | null
    closeDate: string
    notes: string | null
    status: 'matched' | 'needs_review' | 'no_parcel'
  }> = []

  const parcelEvents: Array<{
    id: string
    parcelId: string
    county: County
    kind: string
    docNumber: string
    recordedAt: string
    amount: number | null
    party: string
    raw: Record<string, unknown>
  }> = []

  const refreshed = new Date('2026-08-01T00:00:00.000Z')

  MATCHED_NAMES.forEach((name, i) => {
    const county = CA_TAX.counties[i % CA_TAX.counties.length]
    const oakdale = i < oakdaleSales.length ? oakdaleSales[i] : null
    const meta = COUNTY_META[county]
    const parcelId = id(100 + i)
    const house = oakdale ? oakdale.house : 100 + i * 2
    const street = oakdale ? 'Oakdale Ave' : meta.street
    const city = oakdale ? 'La Verne' : meta.city
    const zip = oakdale ? '91750' : meta.zip
    const parcelCounty = oakdale ? 'Los Angeles' : county
    const address = `${house} ${street}`
    const apn = oakdale ? oakdale.apn : `${8000 + i}-014-${String(i + 1).padStart(3, '0')}`

    parcels.push({
      id: parcelId,
      apn,
      county: parcelCounty,
      address,
      city,
      zip,
      streetNameNorm: streetNameNorm(address),
      lat: oakdale ? 34.1042 + i * 0.0003 : meta.lat + i * 0.0004,
      lng: oakdale ? -117.7721 - i * 0.0003 : meta.lng - i * 0.0004,
      beds: 3 + (i % 3),
      baths: (2 + (i % 2) * 0.5).toFixed(1),
      sqft: 1480 + i * 25,
      yearBuilt: 1968 + (i % 40),
      useCode: 'SFR',
      assessedValue: 410000 + i * 8500,
      baseYear: 2015 + (i % 10),
      baseYearValue: 365000 + i * 6200,
      lastRefreshedAt: refreshed,
    })

    const slug = name.toLowerCase().replace(' ', '.')
    contacts.push({
      id: id(300 + i),
      name,
      email: `${slug}@example.com`,
      phone: `909-555-${String(1200 + i).slice(-4)}`,
      addressRaw: `${address}, ${city}, CA ${zip}`,
      parcelId,
      closeDate: `20${18 + (i % 7)}-${String((i % 12) + 1).padStart(2, '0')}-15`,
      notes: null,
      status: 'matched',
    })

    const sale = oakdale ?? {
      amount: 620000 + i * 7500,
      docNumber: `2022${String(1000 + i).padStart(4, '0')}`,
      recordedAt: contacts[contacts.length - 1].closeDate,
      party: name,
    }

    parcelEvents.push({
      id: id(400 + i),
      parcelId,
      county: parcelCounty,
      kind: 'grant_deed',
      docNumber: sale.docNumber,
      recordedAt: sale.recordedAt,
      amount: sale.amount,
      party: sale.party,
      raw: { source: 'la-verne-fixture', street },
    })
  })

  return {
    agent,
    parcels: [...parcels, ...reviewParcels],
    contacts: [...unmatchedContacts, ...contacts, ...reviewContacts],
    reviewContacts,
    parcelEvents: [...parcelEvents, ...reviewParcelEvents],
  }
}
