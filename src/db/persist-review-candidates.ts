import { contactMatchCandidates } from '@/db/schema'
import {
  findCandidateParcels,
  type ParcelDb,
  type ParcelRecord,
} from '@/matching/candidates'
import { matchAddress } from '@/matching/match-address'
import { parseAddress } from '@/matching/normalize'
import type { Parcel } from '@/matching/types'

export type ReviewContactSeed = {
  id: string
  name: string
  addressRaw: string
}

function asParcel(row: ParcelRecord): Parcel {
  return {
    apn: row.apn,
    county: row.county,
    address: row.address,
    city: row.city,
    zip: row.zip,
  }
}

export async function persistReviewCandidates(
  db: ParcelDb,
  rows: ReviewContactSeed[],
) {
  const candidateRows: Array<{
    contactId: string
    parcelId: string
    confidence: number
    reason: string
    rank: number
  }> = []

  for (const contact of rows) {
    const normalized = parseAddress(contact.addressRaw)
    if (!normalized) {
      throw new Error(`review contact ${contact.name} did not parse`)
    }
    const found = await findCandidateParcels(db, normalized)
    const match = matchAddress(contact.addressRaw, found.map(asParcel))
    if (match.status !== 'needs_review') {
      throw new Error(
        `expected needs_review for ${contact.name}, got ${match.status}`,
      )
    }
    if (match.candidates.length < 2 || match.candidates.length > 3) {
      throw new Error(
        `expected 2-3 candidates for ${contact.name}, got ${match.candidates.length}`,
      )
    }
    const byKey = new Map(
      found.map((parcel) => [`${parcel.county}:${parcel.apn}`, parcel]),
    )
    match.candidates.forEach((candidate, index) => {
      const parcel = byKey.get(
        `${candidate.parcel.county}:${candidate.parcel.apn}`,
      )
      if (!parcel) return
      candidateRows.push({
        contactId: contact.id,
        parcelId: parcel.id,
        confidence: candidate.confidence,
        reason: candidate.reason,
        rank: index + 1,
      })
    })
  }

  if (candidateRows.length) {
    await db.insert(contactMatchCandidates).values(candidateRows)
  }
  return candidateRows
}
