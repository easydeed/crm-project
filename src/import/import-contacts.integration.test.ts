import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, describe, expect, test } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import { VIEW_AS_READ_ONLY } from '@/auth/write-guard'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { listContactsForAccount } from '@/db/contacts'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, contactMatchCandidates, contacts, parcels } from '@/db/schema'
import {
  applyMapping,
  detectColumns,
  looksLikeHeaderRow,
} from '@/import/detect-columns'
import { importContacts } from '@/import/import-contacts'
import { laVerneCsv, laVerneImportRows, laVernePaste } from '@/import/la-verne-csv'
import { parseDelimited } from '@/import/parse-csv'
import { runImport } from '@/import/run-import'
import { SKIP } from '@/import/skip-reasons'
import type { FieldRole, ImportRow } from '@/import/types'
import { withStreetNameNorm } from '@/db/parcel-write'
import { findCandidateParcels } from '@/matching/candidates'
import { matchAddress } from '@/matching/match-address'
import { parseAddress } from '@/matching/normalize'

const sessionUrl = tryLoadIntegrationDatabaseUrl()

const accountIds: string[] = []
const parcelIds: string[] = []

async function insertIsolatedParcels(
  rows: { address: string; city?: string; zip?: string }[],
) {
  const { db } = getRuntimeDb()
  for (const row of rows) {
    const id = randomUUID()
    await db.insert(parcels).values(
      withStreetNameNorm({
        id,
        apn: `OR005-${id.slice(0, 8)}`,
        county: 'Los Angeles',
        address: row.address,
        city: row.city ?? 'Importville',
        zip: row.zip ?? '91993',
      }),
    )
    parcelIds.push(id)
  }
}

async function newAccount() {
  const created = await registerAccount({
    name: 'Import Tester',
    email: `or005-${randomUUID()}@example.com`,
    password: 'long-enough-password',
    brokerage: 'Coastline',
    dre: '01234567',
    phone: '909-555-0100',
  })
  expect(created.ok).toBe(true)
  if (!created.ok) throw new Error('register failed')
  accountIds.push(created.accountId)
  return created.accountId
}

async function expectedSplit(db: ReturnType<typeof getRuntimeDb>['db'], rows: ImportRow[]) {
  const counts = { matched: 0, needs_review: 0, no_parcel: 0 }
  for (const row of rows) {
    const normalized = parseAddress(row.address)
    const found = normalized ? await findCandidateParcels(db, normalized) : []
    const status = matchAddress(
      row.address,
      found.map((parcel) => ({
        apn: parcel.apn,
        county: parcel.county,
        address: parcel.address,
        city: parcel.city,
        zip: parcel.zip,
      })),
    ).status
    counts[status] += 1
  }
  return counts
}

function rowsFromText(text: string): ImportRow[] {
  const table = parseDelimited(text)
  const hasHeader = looksLikeHeaderRow(table[0] ?? [])
  const mapping = hasHeader
    ? detectColumns(table[0]).mapping
    : (['name', 'email', 'address', 'closeDate'] satisfies FieldRole[])
  return applyMapping(table, mapping, hasHeader)
}

describe.skipIf(!sessionUrl)('OR-005 import', { timeout: 120_000 }, () => {
  afterAll(async () => {
    if (!sessionUrl) return
    const { db } = getRuntimeDb()
    if (accountIds.length) {
      await db.delete(contacts).where(inArray(contacts.accountId, accountIds))
      await db.delete(accounts).where(inArray(accounts.id, accountIds))
    }
    if (parcelIds.length) {
      await db.delete(parcels).where(inArray(parcels.id, parcelIds))
    }
  })

  test('47-row La Verne CSV imports with the matcher status split', async () => {
    const accountId = await newAccount()
    const { db } = getRuntimeDb()
    const rows = laVerneImportRows()
    expect(rows).toHaveLength(47)
    const result = await importContacts(db, accountId, rows)
    const expectCounts = await expectedSplit(db, rows)
    expect(result.added).toBe(47)
    expect(result.matched).toBe(expectCounts.matched)
    expect(result.needsReview).toBe(expectCounts.needs_review)
    expect(result.noParcel).toBe(expectCounts.no_parcel)
    expect(result.skipped).toEqual([])
    console.log(
      `La Verne split: ${result.matched} matched, ${result.needsReview} needs_review, ${result.noParcel} no_parcel`,
    )
  })

  test('paste and CSV produce the same mapped rows and status split', async () => {
    const csvRows = rowsFromText(laVerneCsv())
    const pasteRows = rowsFromText(laVernePaste())
    expect(pasteRows.map((row) => ({ name: row.name, email: row.email, address: row.address }))).toEqual(
      csvRows.map((row) => ({ name: row.name, email: row.email, address: row.address })),
    )
    const { db } = getRuntimeDb()
    const csvAccount = await newAccount()
    const pasteAccount = await newAccount()
    const csvResult = await importContacts(db, csvAccount, csvRows)
    const pasteResult = await importContacts(db, pasteAccount, pasteRows)
    expect(pasteResult.matched).toBe(csvResult.matched)
    expect(pasteResult.needsReview).toBe(csvResult.needsReview)
    expect(pasteResult.noParcel).toBe(csvResult.noParcel)
    expect(pasteResult.added).toBe(csvResult.added)
  })

  test('a bad row is skipped and the rest still import', async () => {
    const accountId = await newAccount()
    const { db } = getRuntimeDb()
    const rows = [
      ...laVerneImportRows().slice(0, 2),
      { line: 99, name: 'No Mail', email: '', address: '1840 Oakdale Ave, La Verne, CA 91750', closeDate: null },
    ]
    const result = await importContacts(db, accountId, rows)
    expect(result.added).toBe(2)
    expect(result.skipped).toEqual([
      { line: 99, name: 'No Mail', reason: SKIP.noEmail },
    ])
  })

  test('re-import adds nothing and uses Already in your list', async () => {
    const accountId = await newAccount()
    const { db } = getRuntimeDb()
    const rows = laVerneImportRows()
    await importContacts(db, accountId, rows)
    const again = await importContacts(db, accountId, rows)
    expect(again.added).toBe(0)
    expect(again.skipped).toHaveLength(47)
    expect(again.skipped.every((row) => row.reason === SKIP.alreadyInList)).toBe(true)
  })

  test('the 251st person is skipped for the 250 cap', async () => {
    const accountId = await newAccount()
    const { db } = getRuntimeDb()
    const rows: ImportRow[] = Array.from({ length: 251 }, (_, i) => ({
      line: i + 2,
      name: `Cap ${i}`,
      email: `cap-${i}-${randomUUID()}@example.com`,
      address: `${100 + (i % 50)} Cap Ave, Testville, CA 91990`,
      closeDate: '2020-01-15',
    }))
    const result = await importContacts(db, accountId, rows)
    expect(result.added).toBe(250)
    expect(result.skipped).toEqual([
      { line: 252, name: 'Cap 250', reason: SKIP.overLimit },
    ])
  })

  test('needs_review candidates persist across a second read', async () => {
    await insertIsolatedParcels([
      { address: '1840 Importoak Ave' },
      { address: '1852 Importoak Ave' },
    ])
    const accountId = await newAccount()
    const { db } = getRuntimeDb()
    const result = await importContacts(db, accountId, [
      {
        line: 2,
        name: 'Between Houses',
        email: `review-${randomUUID()}@example.com`,
        address: '1846 Importoak Ave, Importville, CA 91993',
        closeDate: '2021-06-15',
      },
    ])
    expect(result.needsReview).toBe(1)
    const first = await listContactsForAccount(accountId, { status: 'needs_review' })
    expect(first).toHaveLength(1)
    expect(first[0].candidates.length).toBeGreaterThan(0)
    const stored = await db
      .select()
      .from(contactMatchCandidates)
      .where(eq(contactMatchCandidates.contactId, first[0].id))
    expect(stored.length).toBe(first[0].candidates.length)
    const again = await listContactsForAccount(accountId, { status: 'needs_review' })
    expect(again[0].candidates.map((row) => row.reason)).toEqual(
      first[0].candidates.map((row) => row.reason),
    )
    await db.delete(contacts).where(eq(contacts.id, first[0].id))
    const leftover = await db
      .select()
      .from(contactMatchCandidates)
      .where(eq(contactMatchCandidates.contactId, first[0].id))
    expect(leftover).toHaveLength(0)
  })

  test('findCandidateParcels narrows by street, not ZIP alone', async () => {
    await insertIsolatedParcels([
      { address: '1840 Importoak Ave' },
      { address: '1842 Importoak Ave' },
      { address: '1852 Importoak Ave' },
    ])
    const { db } = getRuntimeDb()
    const normalized = parseAddress('1840 Importoak Ave, Importville, CA 91993')
    expect(normalized?.zip).toBe('91993')
    if (!normalized) throw new Error('expected a parsed address')
    const found = await findCandidateParcels(db, normalized)
    expect(found.length).toBeGreaterThan(0)
    expect(found.length).toBeLessThanOrEqual(50)
    expect(found.every((row) => row.zip === '91993')).toBe(true)
    expect(found.every((row) => /importoak/i.test(row.address))).toBe(true)

    const cityOnly = { ...normalized, zip: null }
    const byCity = await findCandidateParcels(db, cityOnly)
    expect(byCity.some((row) => /importoak/i.test(row.address))).toBe(true)
    expect(byCity.every((row) => row.city === 'Importville')).toBe(true)
    expect(byCity.every((row) => /importoak/i.test(row.address))).toBe(true)
  })

  test('250 rows finish in one request', async () => {
    const accountId = await newAccount()
    const { db } = getRuntimeDb()
    const rows: ImportRow[] = Array.from({ length: 250 }, (_, i) => ({
      line: i + 2,
      name: `Batch ${i}`,
      email: `batch-${i}-${randomUUID()}@example.com`,
      address: `${100 + (i % 50)} Cap Ave, Testville, CA 91990`,
      closeDate: '2020-01-15',
    }))
    const result = await importContacts(db, accountId, rows)
    expect(result.added).toBe(250)
    expect(result.elapsedMs).toBeGreaterThan(0)
    console.log(`250-row import elapsedMs=${result.elapsedMs}`)
  })

  test('view-as cannot import', async () => {
    const accountId = await newAccount()
    const form = new FormData()
    form.set('rows', JSON.stringify(laVerneImportRows().slice(0, 1)))
    const blocked = await runImport(
      {
        accountId,
        role: 'admin',
        viewingAsAccountId: accountId,
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      form,
    )
    expect(blocked).toEqual({ error: VIEW_AS_READ_ONLY })
    const rows = await listContactsForAccount(accountId)
    expect(rows).toHaveLength(0)
  })
})
