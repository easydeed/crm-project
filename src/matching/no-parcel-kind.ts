import { looksLikeBareCity, nonAddressReason, parseAddress } from '@/matching/normalize'
import type { MatchStatus } from '@/matching/types'

export type NoParcelKind = 'non_address' | 'unmatched'

export function noParcelKindFor(status: MatchStatus, raw: string): NoParcelKind | null {
  if (status !== 'no_parcel') return null
  if (nonAddressReason(raw) || looksLikeBareCity(raw) || !parseAddress(raw)) {
    return 'non_address'
  }
  return 'unmatched'
}
