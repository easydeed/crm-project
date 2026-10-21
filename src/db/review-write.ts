import { and, eq, sql } from 'drizzle-orm'
import { persistContactCandidates } from '@/db/persist-contact-candidates'
import {
  allowedParcelIdsFromMatch,
  getReviewItemForAccount,
  itemFromMatch,
  loadStoredCandidates,
} from '@/db/review-queue'
import type { ReviewQueueItem, ReviewSnapshot } from '@/db/review-types'
import { getRuntimeDb } from '@/db/runtime'
import { contactsTable, isLiveContact, liveContacts } from '@/db/live-contacts'
import { noParcelKindFor } from '@/matching/no-parcel-kind'
import { resolveAddressMatch } from '@/matching/resolve-match'

export type ReviewWriteResult =
  | { ok: true; snapshot: ReviewSnapshot; after?: ReviewSnapshot; item: ReviewQueueItem | null }
  | { ok: false; error: string }

type ReviewDb = Pick<ReturnType<typeof getRuntimeDb>['db'], 'select'>

async function loadOwnedContact(accountId: string, contactId: string, db: ReviewDb = getRuntimeDb().db) {
  const [row] = await db
    .select({
      id: liveContacts.id,
      name: liveContacts.name,
      addressRaw: liveContacts.addressRaw,
      status: liveContacts.status,
      reviewState: liveContacts.reviewState,
      reviewVersion: liveContacts.reviewVersion,
      matchSource: liveContacts.matchSource,
      noParcelKind: liveContacts.noParcelKind,
      parcelId: liveContacts.parcelId,
    })
    .from(liveContacts)
    .where(and(eq(liveContacts.id, contactId), eq(liveContacts.accountId, accountId)))
    .limit(1)
    .for('update')
  return row ?? null
}

export async function snapshotFor(accountId: string, contactId: string, db: ReviewDb = getRuntimeDb().db): Promise<ReviewSnapshot | null> {
  const row = await loadOwnedContact(accountId, contactId, db)
  if (!row) return null
  const candidates = await loadStoredCandidates(db, contactId)
  return {
    contactId: row.id,
    version: row.reviewVersion,
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

  const after = await applyReviewChange(accountId, snapshot, async (tx) => {
    await tx
      .update(contactsTable)
      .set({
        reviewVersion: sql`${contactsTable.reviewVersion} + 1`,
        status: 'matched',
        parcelId,
        reviewState: 'pending',
        matchSource: contact.status === 'matched' ? 'corrected' : 'review',
        noParcelKind: null,
      })
      .where(and(eq(contactsTable.id, contactId), eq(contactsTable.accountId, accountId), isLiveContact))
    await persistContactCandidates(tx, contactId, [], 'replace')
  })
  if (!after) return { ok: false, error: 'This person changed. Reload to review them.' }
  return { ok: true, snapshot, after, item: null }
}

export async function leaveOutContactForAccount(
  accountId: string,
  contactId: string,
): Promise<ReviewWriteResult> {
  const snapshot = await snapshotFor(accountId, contactId)
  if (!snapshot) return { ok: false, error: 'We could not find that person.' }
  const after = await applyReviewChange(accountId, snapshot, async (tx) => {
    await tx
      .update(contactsTable)
      .set({
        reviewVersion: sql`${contactsTable.reviewVersion} + 1`,
        status: 'no_parcel',
        parcelId: null,
        reviewState: 'reviewed',
        noParcelKind:
          snapshot.noParcelKind ?? noParcelKindFor('no_parcel', snapshot.addressRaw),
      })
      .where(and(eq(contactsTable.id, contactId), eq(contactsTable.accountId, accountId), isLiveContact))
    await persistContactCandidates(tx, contactId, [], 'replace')
  })
  if (!after) return { ok: false, error: 'This person changed. Reload to review them.' }
  return { ok: true, snapshot, after, item: null }
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
  const after = await applyReviewChange(accountId, snapshot, async (tx) => {
    await tx
      .update(contactsTable)
      .set({
        reviewVersion: sql`${contactsTable.reviewVersion} + 1`,
        addressRaw,
        status: match.status,
        parcelId: match.parcelId,
        reviewState: 'pending',
        matchSource: 'auto',
        noParcelKind: match.noParcelKind,
      })
      .where(and(eq(contactsTable.id, contactId), eq(contactsTable.accountId, accountId), isLiveContact))
    await persistContactCandidates(tx, contactId, match.candidates, 'replace')
  })
  if (!after) return { ok: false, error: 'This person changed. Reload to review them.' }
  const row = await loadOwnedContact(accountId, contactId)
  if (!row) return { ok: false, error: 'We could not find that person.' }
  const item =
    match.status === 'matched'
      ? null
      : await itemFromMatch(row, match)
  return { ok: true, snapshot, after, item }
}

export async function undoReviewChangeForAccount(
  accountId: string,
  snapshot: ReviewSnapshot,
  expectedAfter: string | undefined = undefined,
): Promise<ReviewWriteResult> {
  const { db } = getRuntimeDb()
  const restored = await db.transaction(async (tx) => {
    const current = await snapshotFor(accountId, snapshot.contactId, tx)
    if (!current || expectedAfter !== undefined && JSON.stringify(current) !== expectedAfter) return false
    await tx
      .update(contactsTable)
      .set({
        reviewVersion: sql`${contactsTable.reviewVersion} + 1`,
        status: snapshot.status,
        parcelId: snapshot.parcelId,
        reviewState: snapshot.reviewState,
        matchSource: snapshot.matchSource,
        noParcelKind: snapshot.noParcelKind,
        addressRaw: snapshot.addressRaw,
      })
      .where(and(eq(contactsTable.id, snapshot.contactId), eq(contactsTable.accountId, accountId), isLiveContact))
    await persistContactCandidates(tx, snapshot.contactId, snapshot.candidates, 'replace')
    return true
  })
  if (!restored) return { ok: false, error: 'This person changed since that decision. Reload to review them.' }
  return {
    ok: true,
    snapshot,
    item: await getReviewItemForAccount(accountId, snapshot.contactId),
  }
}

// The Undo proof names the actual state this transaction produced, never a later
// edit observed after the transaction returned.
type ReviewTx = Parameters<Parameters<ReturnType<typeof getRuntimeDb>['db']['transaction']>[0]>[0]
async function applyReviewChange(accountId: string, before: ReviewSnapshot, mutate: (tx: ReviewTx) => Promise<void>) {
  return getRuntimeDb().db.transaction(async (tx) => {
    const current = await snapshotFor(accountId, before.contactId, tx)
    if (!current || JSON.stringify(current) !== JSON.stringify(before)) return null
    await mutate(tx)
    return snapshotFor(accountId, before.contactId, tx)
  })
}
