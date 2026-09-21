import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { contactMatchCandidates, contacts } from '@/db/schema'
import { CONTACT_LIMIT, SKIP } from '@/import/skip-reasons'
import type { ImportRow, ImportSummary, SkippedRow } from '@/import/types'
import {
  findCandidateParcels,
  type ParcelDb,
  type ParcelRecord,
} from '@/matching/candidates'
import { matchAddress } from '@/matching/match-address'
import { parseAddress } from '@/matching/normalize'
import type { NormalizedAddress, Parcel } from '@/matching/types'

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
  }> = []
  const candidateRows: Array<{
    contactId: string
    parcelId: string
    confidence: number
    reason: string
    rank: number
  }> = []
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

    const normalized = parseAddress(address)
    const found = normalized
      ? await candidatesFor(db, cache, normalized)
      : []
    const match = matchAddress(
      address,
      found.map((parcel): Parcel => ({
        apn: parcel.apn,
        county: parcel.county,
        address: parcel.address,
        city: parcel.city,
        zip: parcel.zip,
      })),
    )
    const byKey = new Map(found.map((parcel) => [`${parcel.county}:${parcel.apn}`, parcel]))
    const contactId = randomUUID()
    const best =
      match.status === 'matched' && match.candidates[0]
        ? byKey.get(
            `${match.candidates[0].parcel.county}:${match.candidates[0].parcel.apn}`,
          )
        : undefined

    toInsert.push({
      id: contactId,
      accountId,
      name: name || email,
      email,
      addressRaw: address,
      parcelId: best?.id ?? null,
      closeDate: row.closeDate,
      status: match.status,
    })
    if (match.status === 'needs_review') {
      match.candidates.forEach((candidate, index) => {
        const parcel = byKey.get(`${candidate.parcel.county}:${candidate.parcel.apn}`)
        if (!parcel) return
        candidateRows.push({
          contactId,
          parcelId: parcel.id,
          confidence: candidate.confidence,
          reason: candidate.reason,
          rank: index + 1,
        })
      })
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
    })
  }

  return {
    added: toInsert.length,
    matched: toInsert.filter((row) => row.status === 'matched').length,
    needsReview: toInsert.filter((row) => row.status === 'needs_review').length,
    noParcel: toInsert.filter((row) => row.status === 'no_parcel').length,
    skipped,
    elapsedMs: Date.now() - started,
  }
}

async function candidatesFor(
  db: ParcelDb,
  cache: Map<string, ParcelRecord[]>,
  normalized: NormalizedAddress,
) {
  const key = normalized.zip
    ? `z:${normalized.zip}:${normalized.name}`
    : `c:${normalized.city ?? ''}:${normalized.name}`
  const hit = cache.get(key)
  if (hit) return hit
  const rows = await findCandidateParcels(db, normalized)
  cache.set(key, rows)
  return rows
}
