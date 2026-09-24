import { and, eq } from 'drizzle-orm'
import { persistContactCandidates } from '@/db/persist-contact-candidates'
import { getRuntimeDb } from '@/db/runtime'
import { contactSubscriptions, parcels } from '@/db/schema'
import { contactsIncludingDeleted, contactsTable } from '@/db/live-contacts'
import { resolveAddressMatch } from '@/matching/resolve-match'
import { liftSelfUnsubscribe } from '@/suppression/lift'
import { suppress } from '@/suppression/suppressions'
import type { UnsubscribeScope } from '@/unsubscribe/token'

/** The contact row is the fast path; the suppression outlives the contact. */
export async function stopScope(
  contactId: string,
  scope: UnsubscribeScope,
  source: 'unsubscribe_page' | 'one_click',
  now = new Date(),
) {
  const { db } = getRuntimeDb()
  const [contact] = await db.select({ email: contactsIncludingDeleted.email }).from(contactsIncludingDeleted).where(eq(contactsIncludingDeleted.id, contactId)).limit(1)
  if (contact) await suppress(db, contact.email, 'unsubscribed', scope, source, now)
  await db
    .insert(contactSubscriptions)
    .values({ contactId, scope, unsubscribedAt: now })
    .onConflictDoUpdate({
      target: [contactSubscriptions.contactId, contactSubscriptions.scope],
      set: { unsubscribedAt: now },
    })
}

export async function keepScope(contactId: string, scope: UnsubscribeScope) {
  const { db } = getRuntimeDb()
  await db
    .update(contactSubscriptions)
    .set({ unsubscribedAt: null })
    .where(
      and(eq(contactSubscriptions.contactId, contactId), eq(contactSubscriptions.scope, scope)),
    )
}

/**
 * "Actually, keep them coming." Lifts the homeowner's own unsubscribe (logged in
 * suppression_lifts), then turns the subscription back on. Returns false, changing
 * nothing, when the address carries a bounce, a complaint, or any stop they didn't make.
 */
export async function keepComing(contactId: string, scope: UnsubscribeScope, suppressed: boolean) {
  const { db } = getRuntimeDb()
  if (suppressed) {
    const [contact] = await db.select({ email: contactsIncludingDeleted.email }).from(contactsIncludingDeleted).where(eq(contactsIncludingDeleted.id, contactId)).limit(1)
    if (!contact || !(await liftSelfUnsubscribe(db, contact.email, scope))) return false
  }
  await keepScope(contactId, scope)
  return true
}

export type AddressUpdate =
  | { outcome: 'matched'; address: string }
  | { outcome: 'needs_review' }
  | { outcome: 'no_parcel' }

export async function updateHomeownerAddress(
  contactId: string,
  addressRaw: string,
  now = new Date(),
): Promise<AddressUpdate> {
  const trimmed = addressRaw.trim()
  const { db } = getRuntimeDb()
  const match = await resolveAddressMatch(db, trimmed)
  await db.transaction(async (tx) => {
    await tx
      .update(contactsTable)
      .set({
        addressRaw: trimmed,
        status: match.status,
        parcelId: match.parcelId,
        reviewState: 'pending',
        matchSource: 'auto',
        noParcelKind: match.noParcelKind,
        homeownerAddressAt: now,
      })
      .where(eq(contactsIncludingDeleted.id, contactId))
    await persistContactCandidates(tx, contactId, match.candidates, 'replace')
  })
  if (match.status === 'matched' && match.parcelId) {
    const [parcel] = await db
      .select({
        address: parcels.address,
        city: parcels.city,
        zip: parcels.zip,
      })
      .from(parcels)
      .where(eq(parcels.id, match.parcelId))
      .limit(1)
    const address = [parcel?.address, parcel?.city, parcel?.zip].filter(Boolean).join(', ')
    return { outcome: 'matched', address: address || trimmed }
  }
  if (match.status === 'needs_review') return { outcome: 'needs_review' }
  return { outcome: 'no_parcel' }
}

export function addressNotice(result: AddressUpdate): string {
  if (result.outcome === 'matched') return `We'll use ${result.address}.`
  if (result.outcome === 'needs_review') {
    return "We couldn't match that to one house. You're still getting these emails."
  }
  return "We couldn't find that house on the record. You're still getting these emails."
}
