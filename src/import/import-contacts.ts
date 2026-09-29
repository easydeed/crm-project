import { randomUUID } from 'node:crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { candidateInsertRows } from '@/db/persist-contact-candidates'
import { contactMatchCandidates, contactSubscriptions } from '@/db/schema'
import { contactsIncludingDeleted, contactsTable } from '@/db/live-contacts'
import { CONTACT_LIMIT, SKIP } from '@/import/skip-reasons'
import type { ImportRow, ImportSummary, SkippedRow } from '@/import/types'
import { type ParcelDb, type ParcelRecord } from '@/matching/candidates'
import { collapse } from '@/matching/text'
import { resolveAddressMatch } from '@/matching/resolve-match'
import { emailHash } from '@/suppression/hash'
import { SUPPRESSED_REASON, suppressedHashes } from '@/suppression/suppressions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function importContacts(
  db: ParcelDb,
  accountId: string,
  rows: ImportRow[],
): Promise<ImportSummary> {
  const started = Date.now()
  const existing = await db
    .select({
      id: contactsIncludingDeleted.id,
      email: contactsIncludingDeleted.email,
      addressRaw: contactsIncludingDeleted.addressRaw,
      parcelId: contactsIncludingDeleted.parcelId,
      deletedAt: contactsIncludingDeleted.deletedAt,
    })
    .from(contactsIncludingDeleted)
    .where(eq(contactsIncludingDeleted.accountId, accountId))
  const live = existing.filter((row) => !row.deletedAt)
  const seen = new Set(live.flatMap((row) => (row.email ? [row.email.toLowerCase()] : [])))
  // A row with no email is the same person as a live one at the same house.
  const seenAddresses = new Set(live.map((row) => collapse(row.addressRaw)))
  const seenParcels = new Set(live.flatMap((row) => (row.parcelId ? [row.parcelId] : [])))
  // A deleted person whose address comes back is restored, subscription state and all.
  const deleted = new Map(
    existing.flatMap((row) => (row.deletedAt && row.email ? [[row.email.toLowerCase(), row.id] as const] : [])),
  )
  const restoreIds: string[] = []
  let remaining = CONTACT_LIMIT - live.length

  const skipped: SkippedRow[] = []
  const toInsert: Array<{
    id: string
    accountId: string
    name: string
    email: string | null
    addressRaw: string
    parcelId: string | null
    closeDate: string | null
    status: 'matched' | 'needs_review' | 'no_parcel'
    matchSource: 'auto'
    noParcelKind: 'non_address' | 'unmatched' | null
  }> = []
  const candidateRows: ReturnType<typeof candidateInsertRows> = []
  const optedOut: SkippedRow[] = []
  const stopped: Array<{ contactId: string; scope: 'weekly'; unsubscribedAt: Date }> = []
  const emails = rows.flatMap((row) => (row.email ? [row.email] : []))
  const monthly = await suppressedHashes(db, emails, 'monthly')
  const weekly = await suppressedHashes(db, emails, 'weekly')
  const cache = new Map<string, ParcelRecord[]>()

  for (const row of rows) {
    if (row.email === null) {
      const address = row.address.trim()
      const name = row.name.trim()
      if (!address) {
        skipped.push({ line: row.line, name, reason: SKIP.missingAddress })
        continue
      }
      if (seenAddresses.has(collapse(address))) {
        skipped.push({ line: row.line, name, reason: SKIP.alreadyInList })
        continue
      }
      if (remaining <= 0) {
        skipped.push({ line: row.line, name, reason: SKIP.overLimit })
        continue
      }
      const match = await resolveAddressMatch(db, address, cache)
      if (match.parcelId && seenParcels.has(match.parcelId)) {
        skipped.push({ line: row.line, name, reason: SKIP.alreadyInList })
        continue
      }
      // No email means no suppression to check and no deleted person to restore by address.
      const contactId = randomUUID()
      toInsert.push({
        id: contactId, accountId, name, email: null, addressRaw: address, parcelId: match.parcelId,
        closeDate: row.closeDate, status: match.status, matchSource: 'auto', noParcelKind: match.noParcelKind,
      })
      candidateRows.push(...candidateInsertRows(contactId, match.candidates))
      seenAddresses.add(collapse(address))
      if (match.parcelId) seenParcels.add(match.parcelId)
      remaining -= 1
      continue
    }
    const email = row.email.trim()
    const name = row.name.trim()
    const address = row.address.trim()
    if (!EMAIL_RE.test(email)) {
      skipped.push({ line: row.line, name, reason: SKIP.noEmail })
      continue
    }
    if (!address) {
      skipped.push({ line: row.line, name, reason: SKIP.missingAddress })
      continue
    }
    if (seen.has(email.toLowerCase())) {
      skipped.push({ line: row.line, name, reason: SKIP.alreadyInList })
      continue
    }
    if (remaining <= 0) {
      skipped.push({ line: row.line, name, reason: SKIP.overLimit })
      continue
    }
    const restoreId = deleted.get(email.toLowerCase())
    if (restoreId) {
      restoreIds.push(restoreId)
      seen.add(email.toLowerCase())
      remaining -= 1
      continue
    }

    const match = await resolveAddressMatch(db, address, cache)
    const contactId = randomUUID()
    toInsert.push({
      id: contactId,
      accountId,
      name: name || email,
      email,
      addressRaw: address,
      parcelId: match.parcelId,
      closeDate: row.closeDate,
      status: match.status,
      matchSource: 'auto',
      noParcelKind: match.noParcelKind,
    })
    candidateRows.push(...candidateInsertRows(contactId, match.candidates))
    // A suppressed address still joins the list, but lands unsubscribed. Never silently subscribed.
    // The monthly row comes from the contacts_subscribe_on_insert trigger (migration 0006).
    const hash = emailHash(email)
    if (weekly.has(hash)) stopped.push({ contactId, scope: 'weekly', unsubscribedAt: new Date() })
    if (monthly.has(hash) || weekly.has(hash)) {
      optedOut.push({ line: row.line, name: name || email, reason: SUPPRESSED_REASON })
    }
    seen.add(email.toLowerCase())
    seenAddresses.add(collapse(address))
    if (match.parcelId) seenParcels.add(match.parcelId)
    remaining -= 1
  }

  if (restoreIds.length) {
    await db
      .update(contactsTable)
      .set({ deletedAt: null })
      .where(and(eq(contactsTable.accountId, accountId), inArray(contactsTable.id, restoreIds)))
  }
  if (toInsert.length) {
    await db.transaction(async (tx) => {
      await tx.insert(contactsTable).values(toInsert)
      if (candidateRows.length) {
        await tx.insert(contactMatchCandidates).values(candidateRows)
      }
      if (stopped.length) await tx.insert(contactSubscriptions).values(stopped).onConflictDoNothing()
    })
  }

  return {
    added: toInsert.length,
    restored: restoreIds.length,
    matched: toInsert.filter((row) => row.status === 'matched').length,
    needsReview: toInsert.filter((row) => row.status === 'needs_review').length,
    noParcel: toInsert.filter((row) => row.status === 'no_parcel').length,
    skipped,
    optedOut,
    elapsedMs: Date.now() - started,
  }
}
