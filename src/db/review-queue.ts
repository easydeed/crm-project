import { and, asc, count, eq, inArray, or } from 'drizzle-orm'
import { recordedOwnersForParcels } from '@/db/recorded-owner'
import type { ReviewCandidateCard, ReviewQueueItem } from '@/db/review-types'
import { getRuntimeDb } from '@/db/runtime'
import { contactMatchCandidates, contacts, parcels } from '@/db/schema'
import type { ParcelDb } from '@/matching/candidates'
import {
  resolveAddressMatch,
  type PersistedCandidate,
  type ResolvedMatch,
} from '@/matching/resolve-match'
import { nameMatchesOwner } from '@/people/review-state'

type ContactRow = {
  id: string
  name: string
  addressRaw: string
  status: ReviewQueueItem['status']
  reviewState: ReviewQueueItem['reviewState']
  parcelId: string | null
}

const contactCols = {
  id: contacts.id,
  name: contacts.name,
  addressRaw: contacts.addressRaw,
  status: contacts.status,
  reviewState: contacts.reviewState,
  parcelId: contacts.parcelId,
}

export async function listReviewQueueForAccount(accountId: string) {
  const { db } = getRuntimeDb()
  const rows = await db
    .select(contactCols)
    .from(contacts)
    .where(
      and(
        eq(contacts.accountId, accountId),
        or(
          eq(contacts.status, 'needs_review'),
          and(eq(contacts.status, 'no_parcel'), eq(contacts.reviewState, 'pending')),
        ),
      ),
    )
    .orderBy(asc(contacts.name), asc(contacts.id))
  return hydrateQueueItems(rows)
}

export async function getReviewItemForAccount(accountId: string, contactId: string) {
  const { db } = getRuntimeDb()
  const [row] = await db
    .select(contactCols)
    .from(contacts)
    .where(and(eq(contacts.accountId, accountId), eq(contacts.id, contactId)))
    .limit(1)
  if (!row) return null
  const [item] = await hydrateQueueItems([row])
  return item ?? null
}

export async function countLeftOutForAccount(accountId: string) {
  const { db } = getRuntimeDb()
  const [row] = await db
    .select({ n: count() })
    .from(contacts)
    .where(
      and(
        eq(contacts.accountId, accountId),
        eq(contacts.status, 'no_parcel'),
        eq(contacts.reviewState, 'reviewed'),
      ),
    )
  return row?.n ?? 0
}

export async function loadWrongHouseReview(accountId: string, contactId: string) {
  const { db } = getRuntimeDb()
  const [row] = await db
    .select(contactCols)
    .from(contacts)
    .where(and(eq(contacts.accountId, accountId), eq(contacts.id, contactId)))
    .limit(1)
  if (!row || row.status !== 'matched' || !row.parcelId) return null
  const match = await resolveAddressMatch(db, row.addressRaw, undefined, row.parcelId)
  return itemFromMatch(row, match)
}

export async function itemFromMatch(row: ContactRow, match: ResolvedMatch) {
  return {
    id: row.id,
    name: row.name,
    addressRaw: row.addressRaw,
    status: match.status,
    reviewState: row.reviewState,
    parcelId: match.parcelId,
    candidates: await cardsForCandidates(row.name, displayCandidates(match)),
  } satisfies ReviewQueueItem
}

export function displayCandidates(match: ResolvedMatch): PersistedCandidate[] {
  if (match.candidates.length) return match.candidates
  if (!match.parcelId) return []
  return [
    {
      parcelId: match.parcelId,
      confidence: 1,
      reason: match.reason,
      rank: 1,
    },
  ]
}

export function allowedParcelIdsFromMatch(match: ResolvedMatch) {
  return new Set(displayCandidates(match).map((row) => row.parcelId))
}

export async function loadStoredCandidates(db: Pick<ParcelDb, 'select'>, contactId: string) {
  return db
    .select({
      parcelId: contactMatchCandidates.parcelId,
      confidence: contactMatchCandidates.confidence,
      reason: contactMatchCandidates.reason,
      rank: contactMatchCandidates.rank,
    })
    .from(contactMatchCandidates)
    .where(eq(contactMatchCandidates.contactId, contactId))
}

export async function cardsForCandidates(
  contactName: string,
  candidates: PersistedCandidate[],
): Promise<ReviewCandidateCard[]> {
  if (!candidates.length) return []
  const { db } = getRuntimeDb()
  const parcelIds = [...new Set(candidates.map((row) => row.parcelId))]
  const houses = await db
    .select({
      id: parcels.id,
      address: parcels.address,
      city: parcels.city,
      zip: parcels.zip,
      beds: parcels.beds,
      baths: parcels.baths,
      sqft: parcels.sqft,
    })
    .from(parcels)
    .where(inArray(parcels.id, parcelIds))
  const byId = new Map(houses.map((row) => [row.id, row]))
  const owners = await recordedOwnersForParcels(parcelIds)
  return candidates
    .slice()
    .sort((left, right) => left.rank - right.rank)
    .slice(0, 3)
    .flatMap((candidate) => {
      const house = byId.get(candidate.parcelId)
      if (!house) return []
      const recordedOwner = owners.get(house.id) ?? null
      return [
        {
          parcelId: house.id,
          street: house.address,
          city: house.city,
          zip: house.zip,
          recordedOwner,
          beds: house.beds,
          baths: house.baths,
          sqft: house.sqft,
          reason: candidate.reason,
          nameMatches: nameMatchesOwner(contactName, recordedOwner),
        },
      ]
    })
}

async function hydrateQueueItems(rows: ContactRow[]): Promise<ReviewQueueItem[]> {
  const { db } = getRuntimeDb()
  const ids = rows.map((row) => row.id)
  const stored = ids.length
    ? await db
        .select({
          contactId: contactMatchCandidates.contactId,
          parcelId: contactMatchCandidates.parcelId,
          confidence: contactMatchCandidates.confidence,
          reason: contactMatchCandidates.reason,
          rank: contactMatchCandidates.rank,
        })
        .from(contactMatchCandidates)
        .where(inArray(contactMatchCandidates.contactId, ids))
    : []
  const grouped = new Map<string, PersistedCandidate[]>()
  for (const row of stored) {
    const list = grouped.get(row.contactId) ?? []
    list.push({
      parcelId: row.parcelId,
      confidence: row.confidence,
      reason: row.reason,
      rank: row.rank,
    })
    grouped.set(row.contactId, list)
  }
  const items: ReviewQueueItem[] = []
  for (const row of rows) {
    items.push({
      id: row.id,
      name: row.name,
      addressRaw: row.addressRaw,
      status: row.status,
      reviewState: row.reviewState,
      parcelId: row.parcelId,
      candidates: await cardsForCandidates(row.name, grouped.get(row.id) ?? []),
    })
  }
  return items
}
