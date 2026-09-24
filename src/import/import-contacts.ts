import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { candidateInsertRows } from '@/db/persist-contact-candidates'
import { contactMatchCandidates, contactSubscriptions, contacts } from '@/db/schema'
import { CONTACT_LIMIT, SKIP } from '@/import/skip-reasons'
import type { ImportRow, ImportSummary, SkippedRow } from '@/import/types'
import { type ParcelDb, type ParcelRecord } from '@/matching/candidates'
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
    .select({ email: contacts.email })
    .from(contacts)
    .where(eq(contacts.accountId, accountId))
  const seen = new Set(existing.map((row) => row.email.toLowerCase()))
  let remaining = CONTACT_LIMIT - existing.length

  const skipped: SkippedRow[] = []
  const toInsert: Array<{
    id: string
    accountId: string
    name: string
    email: string
    addressRaw: string
    parcelId: string | null
    closeDate: string | null
    status: 'matched' | 'needs_review' | 'no_parcel'
    matchSource: 'auto'
    noParcelKind: 'non_address' | 'unmatched' | null
  }> = []
  const candidateRows: ReturnType<typeof candidateInsertRows> = []
  const optedOut: SkippedRow[] = []
  const stopped: Array<{ contactId: string; scope: 'monthly' | 'weekly'; unsubscribedAt: Date }> = []
  const emails = rows.map((row) => row.email)
  const monthly = await suppressedHashes(db, emails, 'monthly')
  const weekly = await suppressedHashes(db, emails, 'weekly')
  const cache = new Map<string, ParcelRecord[]>()

  for (const row of rows) {
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
    const hash = emailHash(email)
    if (monthly.has(hash)) stopped.push({ contactId, scope: 'monthly', unsubscribedAt: new Date() })
    if (weekly.has(hash)) stopped.push({ contactId, scope: 'weekly', unsubscribedAt: new Date() })
    if (monthly.has(hash) || weekly.has(hash)) {
      optedOut.push({ line: row.line, name: name || email, reason: SUPPRESSED_REASON })
    }
    seen.add(email.toLowerCase())
    remaining -= 1
  }

  if (toInsert.length) {
    await db.transaction(async (tx) => {
      await tx.insert(contacts).values(toInsert)
      if (candidateRows.length) {
        await tx.insert(contactMatchCandidates).values(candidateRows)
      }
      if (stopped.length) await tx.insert(contactSubscriptions).values(stopped)
    })
  }

  return {
    added: toInsert.length,
    matched: toInsert.filter((row) => row.status === 'matched').length,
    needsReview: toInsert.filter((row) => row.status === 'needs_review').length,
    noParcel: toInsert.filter((row) => row.status === 'no_parcel').length,
    skipped,
    optedOut,
    elapsedMs: Date.now() - started,
  }
}
