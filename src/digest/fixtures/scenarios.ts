import { CA_TAX } from '@/config/ca-tax'
import type {
  ContentBlockName,
  DigestEvent,
  DigestInput,
  DigestListing,
  DigestParcel,
} from '@/digest/types'
import { DEED_OF_TRUST, GRANT_DEED, RECONVEYANCE } from '@/digest/types'

export const AS_OF = new Date(Date.UTC(2026, 8, 15))

const agent = {
  name: 'Dana Whitfield',
  brokerage: 'Coastline Realty',
  dre: '01998432',
  phone: '909-555-0147',
  senderName: 'Dana at Coastline',
  replyTo: 'dana@coastline.example',
  accentColor: '#1f4d3a',
}

const oakdale: DigestParcel = {
  address: '1142 Oakdale Ave',
  city: 'La Verne',
  zip: '91750',
  beds: 3,
  baths: '2.0',
  sqft: 1680,
  useCode: 'SFR',
  assessedValue: 425000,
}

const grant: DigestEvent = {
  kind: GRANT_DEED,
  docNumber: '2019041512',
  recordedAt: '2019-04-15',
  amount: 720000,
  party: 'Marilyn Cole',
}

const loan: DigestEvent = {
  kind: DEED_OF_TRUST,
  docNumber: '2019042018',
  recordedAt: '2019-04-20',
  amount: 500000,
  party: 'Coastline Mortgage',
}

const sales: DigestEvent[] = [
  {
    kind: GRANT_DEED,
    docNumber: '2025110888',
    recordedAt: '2025-11-08',
    amount: 980000,
    party: 'Luis Ortega',
    propertyType: 'SFR',
  },
  {
    kind: GRANT_DEED,
    docNumber: '2026032101',
    recordedAt: '2026-03-21',
    amount: 1040000,
    party: 'Elena Vasquez',
    propertyType: 'SFR',
  },
  {
    kind: GRANT_DEED,
    docNumber: '2026051234',
    recordedAt: '2026-05-14',
    amount: 1100000,
    party: 'Maya Chen',
    propertyType: 'SFR',
  },
]

const listing: DigestListing = {
  mlsId: 'CRMLS-410ASH',
  address: '410 Ashford Ave',
  status: 'Active',
  listPrice: 1125000,
  listDate: '2026-08-02',
  beds: 3,
  baths: '2.0',
  sqft: 1720,
  propertyType: 'SFR',
  listingOffice: 'Hillside Brokerage',
  listingAgent: 'Pat Rivera',
}

function input(extra: Partial<DigestInput>): DigestInput {
  return {
    asOf: AS_OF,
    agent,
    contact: { firstName: 'Marilyn', closeDate: '2019-04-20' },
    parcel: oakdale,
    events: [grant, loan],
    streetSales: sales,
    nearbyListing: null,
    tax: CA_TAX,
    ...extra,
  }
}

export type Scenario = {
  name: string
  input: DigestInput
  send: boolean
  blocks: ContentBlockName[]
}

export const scenarios: Scenario[] = [
  {
    name: 'full',
    input: input({ nearbyListing: listing }),
    send: true,
    blocks: ['record', 'four_doors', 'taxes', 'street_sales', 'loan'],
  },
  {
    name: 'no street sales',
    input: input({ streetSales: [] }),
    send: true,
    blocks: ['record', 'loan'],
  },
  {
    name: 'one street sale only',
    input: input({ streetSales: sales.slice(0, 1) }),
    send: true,
    blocks: ['record', 'street_sales', 'loan'],
  },
  {
    name: 'loan paid off',
    input: input({
      events: [
        grant,
        loan,
        {
          kind: RECONVEYANCE,
          docNumber: '2024011502',
          recordedAt: '2024-01-15',
          amount: null,
          party: 'Coastline Mortgage',
        },
      ],
    }),
    send: true,
    blocks: ['record', 'taxes', 'street_sales', 'loan'],
  },
  {
    name: 'no loan recorded',
    input: input({ events: [grant] }),
    send: true,
    blocks: ['record', 'taxes', 'street_sales'],
  },
  {
    name: 'trust vesting',
    input: input({
      events: [
        { ...grant, party: 'The Cole Family Trust dated April 15, 2019' },
        loan,
      ],
    }),
    send: true,
    blocks: ['record', 'taxes', 'street_sales', 'loan'],
  },
  {
    name: 'condo with unit number',
    input: input({
      parcel: { ...oakdale, address: '1142 Oakdale Ave Unit 4', useCode: 'CND' },
      streetSales: sales.map((sale) => ({ ...sale, propertyType: 'CND' })),
    }),
    send: true,
    blocks: ['record', 'taxes', 'street_sales', 'loan'],
  },
  {
    name: 'assessed above street median',
    input: input({
      parcel: { ...oakdale, assessedValue: 2000000 },
    }),
    send: true,
    blocks: ['record', 'street_sales', 'loan'],
  },
  {
    name: 'thin',
    input: input({
      events: [],
      streetSales: [],
      nearbyListing: null,
      parcel: { ...oakdale, assessedValue: null },
    }),
    send: false,
    blocks: [],
  },
  {
    name: 'missing sqft and beds',
    input: input({
      parcel: { ...oakdale, beds: null, baths: null, sqft: null },
      nearbyListing: { ...listing, beds: null, baths: null, sqft: null },
    }),
    send: true,
    blocks: ['record', 'four_doors', 'taxes', 'street_sales', 'loan'],
  },
]
