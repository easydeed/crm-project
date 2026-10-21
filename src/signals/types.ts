export const SIGNAL_KINDS = [
  'home_listed',
  'listed_nearby',
  'sold_nearby',
  'loan_paid_off',
  'tax_upside',
  'quiet_a_while',
] as const

export type SignalKind = (typeof SIGNAL_KINDS)[number]

export type Signal = {
  contactId: string
  kind: SignalKind
  detail: string
  score: number
  asOf: Date
  listingId?: string
}

export type SignalEvent = {
  kind: string
  docNumber: string
  recordedAt: string
  amount: number | null
}

export type SignalParcel = {
  id: string
  address: string
  zip: string
  streetNameNorm: string
  useCode: string | null
  assessedValue: number | null
}

export type SignalContact = {
  id: string
  name: string
  status: 'matched' | 'needs_review' | 'no_parcel'
  subscribed: boolean
  closeDate: string | null
  parcel: SignalParcel | null
  events: SignalEvent[]
}

export type StreetSale = {
  parcelId: string
  address: string
  zip: string
  streetNameNorm: string
  useCode: string | null
  recordedAt: string
  amount: number | null
  docNumber: string
}

export type PriorCall = {
  contactId: string
  period: string
}

export type SignalInput = {
  asOf: Date
  contacts: SignalContact[]
  streetSales: StreetSale[]
  listings?: { id: string; address: string; zip: string; status: string; listDate: string | null }[]
  priorCalls: PriorCall[]
}
