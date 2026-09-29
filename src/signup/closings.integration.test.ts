import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import { accounts, contactMatchCandidates, contactSubscriptions, contacts } from '@/db/schema'
import { providerCalls } from '@/db/schema-billing'
import { closingSearches } from '@/db/schema-signup'
import { importContacts } from '@/import/import-contacts'
import { SKIP } from '@/import/skip-reasons'
import { FixtureListingProvider } from '@/providers/fixture-providers'
import { CLOSED_LISTING_AGENTS } from '@/providers/fixtures/closed-listings'
import { closingToImportRow, importClosings, searchClosings } from '@/signup/closings'

const databaseUrl = tryLoadIntegrationDatabaseUrl()

describe.skipIf(!databaseUrl)('OR-025 signup closings against the database', () => {
  const accountIds: string[] = []

  async function account(label: string) {
    const created = await registerAccount({
      name: `OR025 ${label}`, email: `or025-${label}-${randomUUID()}@example.com`, password: 'long-enough-password',
      brokerage: 'Coastline Realty', dre: '02002525', phone: '909-555-0125',
    })
    if (!created.ok) throw new Error('could not register the test account')
    accountIds.push(created.accountId)
    return created.accountId
  }

  async function peopleOf(accountId: string) {
    return getRuntimeDb().db.select().from(contacts).where(eq(contacts.accountId, accountId))
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
  })

  afterAll(async () => {
    const { db, client } = getRuntimeDb()
    const ids = (await db.select({ id: contacts.id }).from(contacts).where(inArray(contacts.accountId, accountIds))).map((row) => row.id)
    if (ids.length) {
      await db.delete(contactMatchCandidates).where(inArray(contactMatchCandidates.contactId, ids))
      await db.delete(contactSubscriptions).where(inArray(contactSubscriptions.contactId, ids))
      await db.delete(contacts).where(inArray(contacts.id, ids))
    }
    await db.delete(providerCalls).where(inArray(providerCalls.accountId, accountIds))
    await db.delete(accounts).where(inArray(accounts.id, accountIds))
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  test('a malformed id is refused and not saved; a good one is saved, and an empty result is found, not an error', async () => {
    const id = await account('search')
    const { db } = getRuntimeDb()
    expect(await searchClosings(id, 'dana whitfield')).toMatchObject({ kind: 'malformed' })
    expect(await searchClosings(id, '   ')).toMatchObject({ kind: 'malformed' })
    const [before] = await db.select({ mls: accounts.mlsAgentId }).from(accounts).where(eq(accounts.id, id))
    expect(before?.mls).toBeNull()

    expect(await searchClosings(id, CLOSED_LISTING_AGENTS.none)).toEqual({ kind: 'found', agentId: CLOSED_LISTING_AGENTS.none, listings: [] })
    const thin = await searchClosings(id, ` ${CLOSED_LISTING_AGENTS.thin} `)
    expect(thin.kind === 'found' && thin.listings.length).toBe(3)
    const [after] = await db.select({ mls: accounts.mlsAgentId }).from(accounts).where(eq(accounts.id, id))
    expect(after?.mls).toBe(CLOSED_LISTING_AGENTS.thin)
  })

  test('only the ticked closings are imported, read again server-side; a forged id selects nothing', async () => {
    const id = await account('import')
    const all = await new FixtureListingProvider().closedByAgent(CLOSED_LISTING_AGENTS.many)
    const [untickedA, untickedB, ...ticked] = all
    const posted = [...ticked.map((listing) => listing.mlsId), 'FORGED-1', untickedA!.mlsId.toLowerCase()]

    const result = await importClosings(id, CLOSED_LISTING_AGENTS.many, posted)
    expect('error' in result).toBe(false)
    if ('error' in result) return
    // 45 ticked; two of them are the same house on different dates, so one is already in the list.
    const tickedAddresses = new Set(ticked.map((listing) => closingToImportRow(listing, 0).address))
    expect(result.added).toBe(tickedAddresses.size)
    expect(result.added + result.skipped.length).toBe(45)
    expect(result.skipped.map((row) => row.reason)).toEqual(Array(45 - tickedAddresses.size).fill(SKIP.alreadyInList))

    const people = await peopleOf(id)
    expect(people).toHaveLength(tickedAddresses.size)
    expect(people.every((person) => person.email === null)).toBe(true)
    expect(people.every((person) => person.name.startsWith('Homeowner at '))).toBe(true)
    const addresses = new Set(people.map((person) => person.addressRaw))
    for (const left of [untickedA!, untickedB!]) {
      const row = closingToImportRow(left, 0)
      const sameAddressTicked = ticked.some((listing) => closingToImportRow(listing, 0).address === row.address)
      if (!sameAddressTicked) expect(addresses.has(row.address)).toBe(false)
    }
  })

  test('each contact gets the matcher status exactly as a CSV import of the same address does', async () => {
    const mls = await account('status-mls')
    const csv = await account('status-csv')
    const listings = await new FixtureListingProvider().closedByAgent(CLOSED_LISTING_AGENTS.many)
    await importClosings(mls, CLOSED_LISTING_AGENTS.many, listings.map((listing) => listing.mlsId))
    const { db } = getRuntimeDb()
    const csvRows = listings.map((listing, index) => ({
      ...closingToImportRow(listing, index + 1),
      email: `or025-csv-${index}@example.com`,
    }))
    await importContacts(db, csv, csvRows)

    const byAddress = (rows: Awaited<ReturnType<typeof peopleOf>>) =>
      new Map(rows.map((row) => [row.addressRaw, [row.status, row.parcelId, row.noParcelKind]]))
    const fromMls = byAddress(await peopleOf(mls))
    const fromCsv = byAddress(await peopleOf(csv))
    expect(fromMls.size).toBeGreaterThan(0)
    for (const [address, outcome] of fromMls) expect(fromCsv.get(address)).toEqual(outcome)
  })

  test('importing the same closings again adds nobody and says they are already in the list', async () => {
    const id = await account('again')
    const listings = await new FixtureListingProvider().closedByAgent(CLOSED_LISTING_AGENTS.thin)
    const ids = listings.map((listing) => listing.mlsId)
    const first = await importClosings(id, CLOSED_LISTING_AGENTS.thin, ids)
    const second = await importClosings(id, CLOSED_LISTING_AGENTS.thin, ids)
    expect('added' in first && first.added).toBe(3)
    expect('added' in second && second.added).toBe(0)
    expect('skipped' in second && second.skipped.map((row) => row.reason)).toEqual(Array(3).fill(SKIP.alreadyInList))
    expect(await peopleOf(id)).toHaveLength(3)
  })

  test('nothing ticked, or no search yet, imports nothing and says what to do', async () => {
    const id = await account('empty')
    expect(await importClosings(id, CLOSED_LISTING_AGENTS.thin, [])).toEqual({ error: 'Tick at least one home to add.' })
    expect(await importClosings(id, '', ['CR30001'])).toEqual({ error: 'Search for your closings first.' })
    expect(await peopleOf(id)).toHaveLength(0)
  })

  async function providerCallsFor(id: string) {
    const rows = await getRuntimeDb().db.select().from(providerCalls).where(eq(providerCalls.accountId, id))
    return rows.map((row) => `${row.provider}:${row.operation}`)
  }

  test('a signup costs one metered call: the import reads the 15-minute search cache', async () => {
    const id = await account('metered')
    const now = new Date('2026-10-01T17:00:00Z')
    await searchClosings(id, CLOSED_LISTING_AGENTS.thin, now)
    const result = await importClosings(id, CLOSED_LISTING_AGENTS.thin, ['CR30001', 'FORGED-9'], new Date(now.getTime() + 14 * 60_000))
    expect('added' in result && result.added).toBe(1)
    expect(await providerCallsFor(id)).toEqual(['listing:closedByAgent'])
  })

  test('a stale search, or a different agent id, reads the provider again', async () => {
    const id = await account('stale')
    const now = new Date('2026-10-01T17:00:00Z')
    await searchClosings(id, CLOSED_LISTING_AGENTS.thin, now)
    await importClosings(id, CLOSED_LISTING_AGENTS.thin, ['CR30001'], new Date(now.getTime() + 16 * 60_000))
    await importClosings(id, CLOSED_LISTING_AGENTS.many, ['CR25005'], now)
    expect(await providerCallsFor(id)).toEqual(Array(3).fill('listing:closedByAgent'))
  })

  test('writing a search deletes any search older than an hour, from every account', async () => {
    const old = await account('old-search')
    const fresh = await account('new-search')
    const now = new Date('2026-10-01T17:00:00Z')
    await searchClosings(old, CLOSED_LISTING_AGENTS.none, new Date(now.getTime() - 61 * 60_000))
    await searchClosings(fresh, CLOSED_LISTING_AGENTS.none, now)
    const { db } = getRuntimeDb()
    const rows = await db.select({ accountId: closingSearches.accountId }).from(closingSearches).where(inArray(closingSearches.accountId, [old, fresh]))
    expect(rows.map((row) => row.accountId)).toEqual([fresh])
  })
})
