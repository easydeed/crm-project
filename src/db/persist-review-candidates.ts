import { candidateInsertRows } from '@/db/persist-contact-candidates'
import { contactMatchCandidates } from '@/db/schema'
import type { ParcelDb } from '@/matching/candidates'
import { resolveAddressMatch } from '@/matching/resolve-match'

export type ReviewContactSeed = {
  id: string
  name: string
  addressRaw: string
}

export async function persistReviewCandidates(
  db: ParcelDb,
  rows: ReviewContactSeed[],
) {
  const candidateRows: ReturnType<typeof candidateInsertRows> = []

  for (const contact of rows) {
    const match = await resolveAddressMatch(db, contact.addressRaw)
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
    candidateRows.push(...candidateInsertRows(contact.id, match.candidates))
  }

  if (candidateRows.length) {
    await db.insert(contactMatchCandidates).values(candidateRows)
  }
  return candidateRows
}
