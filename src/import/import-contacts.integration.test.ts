import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, describe, expect, test } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import { VIEW_AS_READ_ONLY } from '@/auth/write-guard'
import { loadDatabasePoolerUrl, loadDatabaseUrl } from '@/config/database-url'
import { createDb } from '@/db/client'
import { listContactsForAccount } from '@/db/contacts'
import { buildLaVerneFixtures } from '@/db/fixtures/la-verne'
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
import { findCandidateParcels } from '@/matching/candidates'
import { matchAddress } from '@/matching/match-address'
import { parseAddress } from '@/matching/normalize'

let poolerUrl: string | null = null
let sessionUrl: string | null = null
try {
  poolerUrl = loadDatabasePoolerUrl()
  sessionUrl = loadDatabaseUrl()
} catch {
  poolerUrl = null
  sessionUrl = null
}

const accountIds: string[] = []
const extraParcelIds: string[] = []

async function ensureLaVerneParcels() {
  const { db } = getRuntimeDb()
  const fixture = buildLaVerneFixtures()
  const existing = await db
    .select({
      id: parcels.id,
      county: parcels.county,
      apn: parcels.apn,
      address: parcels.address,
      city: parcels.city,
      zip: parcels.zip,
    })
    .from(parcels)
  const havePlace = new Set(
    existing.map((row) => `${row.address}|${row.city}|${row.zip}`),
  )
  const haveId = new Set(existing.map((row) => row.id))
  const haveApn = new Set(existing.map((row) => `${row.county}:${row.apn}`))
  const missing = fixture.parcels
    .filter((row) => !havePlace.has(`${row.address}|${row.city}|${row.zip}`))
    .map((row) => ({
      ...row,
      id: haveId.has(row.id) ? randomUUID() : row.id,
      apn: haveApn.has(`${row.county}:${row.apn}`)
        ? `OR005-${randomUUID().slice(0, 8)}`
        : row.apn,
    }))
  if (missing.length) await db.insert(parcels).values(missing)
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

describe.skipIf(!poolerUrl)('OR-005 import', { timeout: 30_000 }, () => {
  afterAll(async () => {
    if (!poolerUrl) return
    const { db } = getRuntimeDb()
    if (accountIds.length) {
      await db.delete(contacts).where(inArray(contacts.accountId, accountIds))
      await db.delete(accounts).where(inArray(accounts.id, accountIds))
    }
    if (extraParcelIds.length) {
      await db.delete(parcels).where(inArray(parcels.id, extraParcelIds))
    }
  })

  test('47-row La Verne CSV imports with the matcher status split', async () => {
    await ensureLaVerneParcels()
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
    await ensureLaVerneParcels()
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
    await ensureLaVerneParcels()
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
    await ensureLaVerneParcels()
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
    await ensureLaVerneParcels()
    const accountId = await newAccount()
    const { db } = getRuntimeDb()
    const addresses = buildLaVerneFixtures()
      .contacts.filter((contact) => contact.status === 'matched')
      .map((contact) => contact.addressRaw)
    const rows: ImportRow[] = Array.from({ length: 251 }, (_, i) => ({
      line: i + 2,
      name: `Cap ${i}`,
      email: `cap-${i}-${randomUUID()}@example.com`,
      address: addresses[i % addresses.length],
      closeDate: '2020-01-15',
    }))
    const result = await importContacts(db, accountId, rows)
    expect(result.added).toBe(250)
    expect(result.skipped).toEqual([
      { line: 252, name: 'Cap 250', reason: SKIP.overLimit },
    ])
  })

  test('needs_review candidates persist across a second read', async () => {
    await ensureLaVerneParcels()
    const accountId = await newAccount()
    const { db } = getRuntimeDb()
    const result = await importContacts(db, accountId, [
      {
        line: 2,
        name: 'Between Houses',
        email: `review-${randomUUID()}@example.com`,
        address: '1846 Oakdale Ave, La Verne, CA 91750',
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

  test('findCandidateParcels ZIP lookup uses parcels_zip_idx', async () => {
    await ensureLaVerneParcels()
    const { db } = getRuntimeDb()
    const normalized = parseAddress('1840 Oakdale Ave, La Verne, CA 91750')
    expect(normalized?.zip).toBe('91750')
    if (!normalized) throw new Error('expected a parsed address')
    const found = await findCandidateParcels(db, normalized)
    expect(found.length).toBeGreaterThan(0)
    expect(found.length).toBeLessThanOrEqual(50)
    expect(found.every((row) => row.zip === '91750')).toBe(true)

    const cityOnly = { ...normalized, zip: null }
    const byCity = await findCandidateParcels(db, cityOnly)
    expect(byCity.some((row) => /oakdale/i.test(row.address))).toBe(true)

    if (!sessionUrl) return
    const session = createDb(sessionUrl)
    const fillers = Array.from({ length: 80 }, (_, i) => {
      const id = randomUUID()
      extraParcelIds.push(id)
      return {
        id,
        apn: `EXPLAIN-${id.slice(0, 8)}`,
        county: 'Los Angeles',
        address: `${100 + i} Filler Rd`,
        city: 'Pomona',
        zip: `8${String(1000 + i).slice(-4)}`,
      }
    })
    await session.db.insert(parcels).values(fillers)
    await session.client.unsafe('set enable_seqscan = off')
    const explained = await session.client.unsafe(
      `explain (format json) select id, apn, county, address, city, zip from parcels where zip = '91750' limit 50`,
    )
    await session.client.unsafe('set enable_seqscan = on')
    const planText = JSON.stringify(explained)
    console.log(`EXPLAIN zip=91750: ${planText}`)
    expect(planText).toMatch(/parcels_zip_idx/)
    await session.client.end({ timeout: 2 })
  })

  test('250 rows finish in one request', async () => {
    await ensureLaVerneParcels()
    const accountId = await newAccount()
    const { db } = getRuntimeDb()
    const addresses = buildLaVerneFixtures()
      .contacts.filter((contact) => contact.status === 'matched')
      .map((contact) => contact.addressRaw)
    const rows: ImportRow[] = Array.from({ length: 250 }, (_, i) => ({
      line: i + 2,
      name: `Batch ${i}`,
      email: `batch-${i}-${randomUUID()}@example.com`,
      address: addresses[i % addresses.length],
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
