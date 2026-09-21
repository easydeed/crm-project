import { and, asc, eq, inArray } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { contactMatchCandidates, contacts } from '@/db/schema'

export type ContactListStatus = 'matched' | 'needs_review' | 'no_parcel'

export type ContactListRow = {
  id: string
  name: string
  email: string
  addressRaw: string
  status: ContactListStatus
  candidates: Array<{
    parcelId: string
    confidence: number
    reason: string
    rank: number
  }>
}

export async function listContactsForAccount(
  accountId: string,
  filters?: { status?: ContactListStatus },
): Promise<ContactListRow[]> {
  const { db } = getRuntimeDb()
  const rows = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      email: contacts.email,
      addressRaw: contacts.addressRaw,
      status: contacts.status,
    })
    .from(contacts)
    .where(
      filters?.status
        ? and(eq(contacts.accountId, accountId), eq(contacts.status, filters.status))
        : eq(contacts.accountId, accountId),
    )
    .orderBy(asc(contacts.name))

  const reviewIds = rows
    .filter((row) => row.status === 'needs_review')
    .map((row) => row.id)
  const candidates = reviewIds.length
    ? await db
        .select({
          contactId: contactMatchCandidates.contactId,
          parcelId: contactMatchCandidates.parcelId,
          confidence: contactMatchCandidates.confidence,
          reason: contactMatchCandidates.reason,
          rank: contactMatchCandidates.rank,
        })
        .from(contactMatchCandidates)
        .where(inArray(contactMatchCandidates.contactId, reviewIds))
    : []

  return rows.map((row) => ({
    ...row,
    candidates: candidates
      .filter((candidate) => candidate.contactId === row.id)
      .sort((left, right) => left.rank - right.rank)
      .map(({ parcelId, confidence, reason, rank }) => ({
        parcelId,
        confidence,
        reason,
        rank,
      })),
  }))
}

export function contactStatusLabel(status: ContactListStatus): string {
  if (status === 'matched') return 'On the map'
  if (status === 'needs_review') return 'Needs review'
  return 'No parcel'
}
