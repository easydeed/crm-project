import {
  findCandidateParcels,
  type ParcelDb,
  type ParcelRecord,
} from '@/matching/candidates'
import { matchAddress } from '@/matching/match-address'
import { noParcelKindFor, type NoParcelKind } from '@/matching/no-parcel-kind'
import { parseAddress } from '@/matching/normalize'
import type { MatchStatus } from '@/matching/types'

export type PersistedCandidate = {
  parcelId: string
  confidence: number
  reason: string
  rank: number
}

export type ResolvedMatch = {
  status: MatchStatus
  parcelId: string | null
  candidates: PersistedCandidate[]
  reason: string
  noParcelKind: NoParcelKind | null
}

export function cacheKeyForNormalized(normalized: {
  zip: string | null
  city: string | null
  name: string
}) {
  return normalized.zip
    ? `z:${normalized.zip}:${normalized.name}`
    : `c:${normalized.city ?? ''}:${normalized.name}`
}

export function applyParcelMatch(
  addressRaw: string,
  found: ParcelRecord[],
): ResolvedMatch {
  const match = matchAddress(
    addressRaw,
    found.map((parcel) => ({
      apn: parcel.apn,
      county: parcel.county,
      address: parcel.address,
      city: parcel.city,
      zip: parcel.zip,
    })),
  )
  const byKey = new Map(
    found.map((parcel) => [`${parcel.county}:${parcel.apn}`, parcel]),
  )
  const top = match.candidates[0]
  const best =
    match.status === 'matched' && top
      ? byKey.get(`${top.parcel.county}:${top.parcel.apn}`)
      : undefined
  const candidates =
    match.status === 'needs_review'
      ? match.candidates.flatMap((candidate, index) => {
          const parcel = byKey.get(
            `${candidate.parcel.county}:${candidate.parcel.apn}`,
          )
          if (!parcel) return []
          return [
            {
              parcelId: parcel.id,
              confidence: candidate.confidence,
              reason: candidate.reason,
              rank: index + 1,
            },
          ]
        })
      : []

  return {
    status: match.status,
    parcelId: best?.id ?? null,
    candidates,
    reason: match.reason,
    noParcelKind: noParcelKindFor(match.status, addressRaw),
  }
}

export async function resolveAddressMatch(
  db: ParcelDb,
  addressRaw: string,
  cache?: Map<string, ParcelRecord[]>,
  excludeParcelId?: string | null,
): Promise<ResolvedMatch> {
  const normalized = parseAddress(addressRaw)
  let found: ParcelRecord[] = []
  if (normalized) {
    const key = cacheKeyForNormalized(normalized)
    const hit = cache?.get(key)
    if (hit) {
      found = hit
    } else {
      found = await findCandidateParcels(db, normalized)
      cache?.set(key, found)
    }
  }
  if (excludeParcelId) {
    found = found.filter((parcel) => parcel.id !== excludeParcelId)
  }
  return applyParcelMatch(addressRaw, found)
}
