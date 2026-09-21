import { eq } from 'drizzle-orm'
import { contactMatchCandidates } from '@/db/schema'
import type { ParcelDb } from '@/matching/candidates'
import type { PersistedCandidate } from '@/matching/resolve-match'

export function candidateInsertRows(
  contactId: string,
  candidates: PersistedCandidate[],
) {
  return candidates.map((candidate) => ({
    contactId,
    parcelId: candidate.parcelId,
    confidence: candidate.confidence,
    reason: candidate.reason,
    rank: candidate.rank,
  }))
}

export async function persistContactCandidates(
  db: Pick<ParcelDb, 'delete' | 'insert'>,
  contactId: string,
  candidates: PersistedCandidate[],
  mode: 'insert' | 'replace' = 'insert',
) {
  if (mode === 'replace') {
    await db
      .delete(contactMatchCandidates)
      .where(eq(contactMatchCandidates.contactId, contactId))
  }
  const rows = candidateInsertRows(contactId, candidates)
  if (rows.length) {
    await db.insert(contactMatchCandidates).values(rows)
  }
}
