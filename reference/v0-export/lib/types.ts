export type ContactStatus = 'matched' | 'needs_review' | 'no_parcel'

export type Engagement =
  | 'opened_recently'
  | 'quiet'
  | 'moved'
  | 'never_opened'

export type PropertyRecord = {
  deedRecorded: string
  docNumber: string
  recordedPrice: number
  vesting: string
  loanAmount: number
  loanRecorded: string
  lender: string
  reconveyed: boolean
  assessedValue: number
  streetMedian: number
}

export type Contact = {
  id: string
  name: string
  email: string
  phone?: string
  address: string
  city: string
  closedDate: string
  status: ContactStatus
  engagement: Engagement
  groups: string[]
  notes?: string
  record?: PropertyRecord
  /** 'farm' rows come from a farmed street, not the agent's sphere */
  source?: 'sphere' | 'farm'
  farmStreet?: string
}

export type CallSignalKind =
  | 'reading_closely'
  | 'new_deed_nearby'
  | 'loan_reconveyed'

export type CallSignal = {
  contactId: string
  kind: CallSignalKind
  detail: string
}

export type EmailEvent = {
  id: string
  month: string
  status: 'sent' | 'scheduled' | 'skipped'
}

export type Lot = {
  id: string
  /** column index within its row */
  col: number
  /** 0 = top row (odd side), 1 = bottom row (even side) */
  row: number
  kind: 'client' | 'sold' | 'plain'
  price?: number
}

export type AddonTier = 'extra' | 'texting'
export type AddonFormKind = 'lender' | 'street' | 'business'

export type Addon = {
  id: string
  title: string
  detail: string
  /** short price label, e.g. "$4" */
  price: string
  /** monthly dollar amount for the bill summary */
  priceValue: number
  /** unit suffix shown after the price, e.g. "/mo" or "/mo per street" */
  unit: string
  tier: AddonTier
  enabled: boolean
  requiresForm?: AddonFormKind
}

/** The client-texting add-on cannot turn on instantly — it registers first. */
export type TextingStatus = 'off' | 'registering' | 'active' | 'rejected'

export type BusinessInfo = {
  legalName: string
  address: string
  taxKind: 'ein' | 'sole_prop'
  ein: string
  website: string
  sampleMessage: string
}
