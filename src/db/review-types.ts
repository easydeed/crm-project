import type { PersistedCandidate } from '@/matching/resolve-match'
import type { ContactReviewState } from '@/people/review-state'
import type { ContactMatchStatus } from '@/people/status'

export type ReviewCandidateCard = {
  parcelId: string
  street: string
  city: string
  zip: string
  recordedOwner: string | null
  beds: number | null
  baths: string | null
  sqft: number | null
  reason: string
  nameMatches: boolean
}

export type ReviewQueueItem = {
  id: string
  name: string
  addressRaw: string
  status: ContactMatchStatus
  reviewState: ContactReviewState
  parcelId: string | null
  candidates: ReviewCandidateCard[]
}

export type ReviewSnapshot = {
  contactId: string
  status: ContactMatchStatus
  parcelId: string | null
  reviewState: ContactReviewState
  addressRaw: string
  candidates: PersistedCandidate[]
}
