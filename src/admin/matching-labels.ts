import type { ContactMatchSource } from '@/db/review-types'
import type { NoParcelKind } from '@/matching/no-parcel-kind'
import type { ContactMatchStatus } from '@/people/status'

export type FailureStatusFilter = 'needs_review' | 'no_parcel' | 'corrected'

export function matcherReturnedLabel(
  status: ContactMatchStatus,
  noParcelKind: NoParcelKind | null,
) {
  if (status === 'needs_review') return 'needs_review'
  if (status === 'no_parcel' && noParcelKind === 'unmatched') {
    return 'no_parcel · real address'
  }
  if (status === 'no_parcel') return 'no_parcel'
  return 'matched'
}

export function howResolvedLabel(
  status: ContactMatchStatus,
  matchSource: ContactMatchSource,
  reviewState: 'pending' | 'reviewed',
) {
  if (matchSource === 'corrected') return 'Wrong house?'
  if (matchSource === 'review') return 'Agent picked a house'
  if (status === 'needs_review') return 'Still needs a look'
  if (status === 'no_parcel' && reviewState === 'reviewed') return 'Left out'
  if (status === 'no_parcel') return 'No house found'
  return 'Auto'
}

export function parseFailureStatus(value: string | undefined): FailureStatusFilter | undefined {
  if (value === 'needs_review' || value === 'no_parcel' || value === 'corrected') {
    return value
  }
  return undefined
}

export function isMatchingFailure(row: {
  status: ContactMatchStatus
  matchSource: ContactMatchSource
  noParcelKind: NoParcelKind | null
}) {
  if (row.matchSource === 'corrected') return true
  if (row.status === 'needs_review') return true
  return row.status === 'no_parcel' && row.noParcelKind === 'unmatched'
}
