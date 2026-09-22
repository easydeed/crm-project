import { and, eq } from 'drizzle-orm'
import { persistContactCandidates } from '@/db/persist-contact-candidates'
import {
  allowedParcelIdsFromMatch,
  getReviewItemForAccount,
  itemFromMatch,
  loadStoredCandidates,
} from '@/db/review-queue'
import type { ReviewQueueItem, ReviewSnapshot } from '@/db/review-types'
import { getRuntimeDb } from '@/db/runtime'
import { contacts } from '@/db/schema'
import { noParcelKindFor } from '@/matching/no-parcel-kind'
import { resolveAddressMatch } from '@/matching/resolve-match'

export type ReviewWriteResult =
  | { ok: true; snapshot: ReviewSnapshot; item: ReviewQueueItem | null }
  | { ok: false; error: string }

async function loadOwnedContact(accountId: string, contactId: string) {
  const { db } = getRuntimeDb()
  const [row] = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      addressRaw: contacts.addressRaw,
      status: contacts.status,
      reviewState: contacts.reviewState,
      matchSource: contacts.matchSource,
      noParcelKind: contacts.noParcelKind,
      parcelId: contacts.parcelId,
    })
    .from(contacts)
    .where(and(eq(contacts.id, contactId), eq(contacts.accountId, accountId)))
    .limit(1)
  return row ?? null
}

async function snapshotFor(accountId: string, contactId: string): Promise<ReviewSnapshot | null> {
  const { db } = getRuntimeDb()
  const row = await loadOwnedContact(accountId, contactId)
  if (!row) return null
  const candidates = await loadStoredCandidates(db, contactId)
  return {
    contactId: row.id,
    status: row.status,
    parcelId: row.parcelId,
    reviewState: row.reviewState,
    matchSource: row.matchSource,
    noParcelKind: row.noParcelKind,
    addressRaw: row.addressRaw,
    candidates,
  }
}

async function parcelIsAllowed(
  contact: NonNullable<Awaited<ReturnType<typeof loadOwnedContact>>>,
  parcelId: string,
) {
  const { db } = getRuntimeDb()
  const stored = await loadStoredCandidates(db, contact.id)
  if (stored.some((row) => row.parcelId === parcelId)) return true
  if (contact.status === 'matched' && contact.parcelId) {
    const match = await resolveAddressMatch(db, contact.addressRaw, undefined, contact.parcelId)
    return allowedParcelIdsFromMatch(match).has(parcelId)
  }
  return false
}

export async function chooseCandidateForAccount(
  accountId: string,
  contactId: string,
  parcelId: string,
): Promise<ReviewWriteResult> {
  const contact = await loadOwnedContact(accountId, contactId)
  if (!contact) return { ok: false, error: 'We could not find that person.' }
  if (!(await parcelIsAllowed(contact, parcelId))) {
    return { ok: false, error: 'That house is not one of the matches.' }
  }
  const snapshot = await snapshotFor(accountId, contactId)
  if (!snapshot) return { ok: false, error: 'We could not find that person.' }

  const { db } = getRuntimeDb()
  await db.transaction(async (tx) => {
    await tx
      .update(contacts)
      .set({
        status: 'matched',
        parcelId,
        reviewState: 'pending',
        matchSource: contact.status === 'matched' ? 'corrected' : 'review',
        noParcelKind: null,
      })
      .where(and(eq(contacts.id, contactId), eq(contacts.accountId, accountId)))
    await persistContactCandidates(tx, contactId, [], 'replace')
  })
  return { ok: true, snapshot, item: null }
}

export async function leaveOutContactForAccount(
  accountId: string,
  contactId: string,
): Promise<ReviewWriteResult> {
  const snapshot = await snapshotFor(accountId, contactId)
  if (!snapshot) return { ok: false, error: 'We could not find that person.' }
  const { db } = getRuntimeDb()
  await db.transaction(async (tx) => {
    await tx
      .update(contacts)
      .set({
        status: 'no_parcel',
        parcelId: null,
        reviewState: 'reviewed',
        noParcelKind:
          snapshot.noParcelKind ?? noParcelKindFor('no_parcel', snapshot.addressRaw),
      })
      .where(and(eq(contacts.id, contactId), eq(contacts.accountId, accountId)))
    await persistContactCandidates(tx, contactId, [], 'replace')
  })
  return { ok: true, snapshot, item: null }
}

export async function fixReviewAddressForAccount(
  accountId: string,
  contactId: string,
  addressRaw: string,
): Promise<ReviewWriteResult> {
  const snapshot = await snapshotFor(accountId, contactId)
  if (!snapshot) return { ok: false, error: 'We could not find that person.' }
  const { db } = getRuntimeDb()
  const match = await resolveAddressMatch(db, addressRaw)
  await db.transaction(async (tx) => {
    await tx
      .update(contacts)
      .set({
        addressRaw,
        status: match.status,
        parcelId: match.parcelId,
        reviewState: 'pending',
        matchSource: 'auto',
        noParcelKind: match.noParcelKind,
      })
      .where(and(eq(contacts.id, contactId), eq(contacts.accountId, accountId)))
    await persistContactCandidates(tx, contactId, match.candidates, 'replace')
  })
  const row = await loadOwnedContact(accountId, contactId)
  if (!row) return { ok: false, error: 'We could not find that person.' }
  const item =
    match.status === 'matched'
      ? null
      : await itemFromMatch(row, match)
  return { ok: true, snapshot, item }
}

export async function undoReviewChangeForAccount(
  accountId: string,
  snapshot: ReviewSnapshot,
): Promise<ReviewWriteResult> {
  const current = await loadOwnedContact(accountId, snapshot.contactId)
  if (!current) return { ok: false, error: 'We could not find that person.' }
  const { db } = getRuntimeDb()
  await db.transaction(async (tx) => {
    await tx
      .update(contacts)
      .set({
        status: snapshot.status,
        parcelId: snapshot.parcelId,
        reviewState: snapshot.reviewState,
        matchSource: snapshot.matchSource,
        noParcelKind: snapshot.noParcelKind,
        addressRaw: snapshot.addressRaw,
      })
      .where(and(eq(contacts.id, snapshot.contactId), eq(contacts.accountId, accountId)))
    await persistContactCandidates(tx, snapshot.contactId, snapshot.candidates, 'replace')
  })
  return {
    ok: true,
    snapshot,
    item: await getReviewItemForAccount(accountId, snapshot.contactId),
  }
}
