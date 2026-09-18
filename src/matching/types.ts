export type MatchStatus = 'matched' | 'needs_review' | 'no_parcel'

export type Parcel = {
  apn: string
  county: string
  address: string
  city: string
  zip: string
}

export type NormalizedAddress = {
  number: string | null
  name: string
  street: string
  directional: string | null
  suffix: string | null
  unit: string | null
  city: string | null
  zip: string | null
}

export type MatchCandidate = {
  parcel: Parcel
  confidence: number
  reason: string
}

export type MatchResult = {
  status: MatchStatus
  candidates: MatchCandidate[]
  normalized: NormalizedAddress | null
  reason: string
}

export type AddressFixture = {
  raw: string
  expect: MatchStatus
  expectApn?: string
  note?: string
}
