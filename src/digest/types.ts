import type { CA_TAX } from '@/config/ca-tax'

export const GRANT_DEED = 'grant_deed'
export const DEED_OF_TRUST = 'deed_of_trust'
export const RECONVEYANCE = 'reconveyance'

export type DigestAgent = {
  name: string
  brokerage: string | null
  dre: string | null
  phone: string | null
  senderName: string | null
  replyTo: string | null
  accentColor: string | null
}

export type DigestContact = {
  firstName: string
  closeDate: string | null
}

export type DigestParcel = {
  address: string
  city: string
  zip: string
  beds: number | null
  baths: string | null
  sqft: number | null
  useCode: string | null
  assessedValue: number | null
}

export type DigestEvent = {
  kind: string
  docNumber: string
  recordedAt: string
  amount: number | null
  party: string | null
  propertyType?: string | null
}

export type DigestListing = {
  mlsId: string
  address: string
  status: string
  listPrice: number | null
  listDate: string | null
  beds: number | null
  baths: string | null
  sqft: number | null
  propertyType: string | null
  listingOffice: string | null
  listingAgent: string | null
}

export type DigestInput = {
  asOf: Date
  agent: DigestAgent
  contact: DigestContact
  parcel: DigestParcel
  events: DigestEvent[]
  streetSales: DigestEvent[]
  nearbyListing: DigestListing | null
  tax: typeof CA_TAX
}

export type ContentBlockName =
  | 'record'
  | 'four_doors'
  | 'taxes'
  | 'street_sales'
  | 'loan'

export type BlockOutput = {
  name: ContentBlockName
  html: string
  text: string
}

export type DigestResult =
  | {
      send: true
      subject: string
      html: string
      text: string
      blocks: ContentBlockName[]
    }
  | { send: false; reason: string }
