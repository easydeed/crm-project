import {
  looksLikeBareCity,
  nonAddressReason,
  parseAddress,
} from './normalize'
import { scoreParcel } from './score'
import type { MatchResult, Parcel } from './types'

export function matchAddress(raw: string, candidates: Parcel[]): MatchResult {
  const blocked = nonAddressReason(raw)
  if (blocked) {
    return emptyResult(blocked)
  }

  const normalized = parseAddress(raw)
  if (!normalized) {
    const reason = looksLikeBareCity(raw)
      ? 'This is a city, not a street address'
      : 'This looks like a name, not a street address'
    return emptyResult(reason)
  }

  const scored = candidates
    .map((parcel) => scoreParcel(normalized, parcel))
    .filter((row) => row.confidence > 0.4)
    .sort((left, right) => {
      if (right.confidence !== left.confidence) {
        return right.confidence - left.confidence
      }
      return left.parcel.apn.localeCompare(right.parcel.apn)
    })
    .slice(0, 3)

  if (!scored.length) {
    return {
      status: 'no_parcel',
      candidates: [],
      normalized,
      reason: 'No house on the record matches this address',
    }
  }

  const best = scored[0]
  const uniqueMatch =
    best.confidence >= 0.9 &&
    scored.every((row, index) => index === 0 || row.confidence <= 0.7)

  return {
    status: uniqueMatch ? 'matched' : 'needs_review',
    candidates: scored,
    normalized,
    reason: uniqueMatch
      ? best.reason
      : scored.length > 1
        ? 'More than one house could match this address'
        : best.reason,
  }
}

function emptyResult(reason: string): MatchResult {
  return { status: 'no_parcel', candidates: [], normalized: null, reason }
}
