import { randomUUID } from 'node:crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, describe, expect, test } from 'vitest'
import { fixturesToJson } from '@/admin/matching-export'
import { registerAccount } from '@/auth/register-account'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import {
  listMatchingFailuresForAdmin,
  listMatchingOverviewForAdmin,
} from '@/db/admin-matching'
import { updateContactForAccount } from '@/db/contact-write'
import { persistContactCandidates } from '@/db/persist-contact-candidates'
import { withStreetNameNorm } from '@/db/parcel-write'
import { chooseCandidateForAccount } from '@/db/review-write'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, contacts, parcels } from '@/db/schema'
import { importContacts } from '@/import/import-contacts'

const sessionUrl = tryLoadIntegrationDatabaseUrl()

const accountIds: string[] = []
const parcelIds: string[] = []

async function register(name: string, role: 'agent' | 'admin' = 'agent') {
  const created = await registerAccount({
    name,
    email: `or008-${name.replace(/\s+/g, '-').toLowerCase()}-${randomUUID()}@example.com`,
    password: 'long-enough-password',
    brokerage: 'Coastline',
    dre: '01234567',
    phone: '909-555-0100',
  })
  expect(created.ok).toBe(true)
  if (!created.ok) throw new Error('register failed')
  accountIds.push(created.accountId)
  if (role === 'admin') {
    const { db } = getRuntimeDb()
    await db.update(accounts).set({ role: 'admin' }).where(eq(accounts.id, created.accountId))
  }
  return created.accountId
}

async function insertHouse(address: string, apn: string) {
  const { db } = getRuntimeDb()
  const id = randomUUID()
  await db.insert(parcels).values(
    withStreetNameNorm({
      id,
      apn,
      county: 'Los Angeles',
      address,
      city: 'La Verne',
      zip: '91991',
    }),
  )
  parcelIds.push(id)
  return id
}

async function insertPerson(
  accountId: string,
  extra: {
    name: string
    addressRaw: string
    status: 'matched' | 'needs_review' | 'no_parcel'
    matchSource?: 'auto' | 'review' | 'corrected'
    noParcelKind?: 'non_address' | 'unmatched' | null
    parcelId?: string | null
  },
) {
  const { db } = getRuntimeDb()
  const id = randomUUID()
  await db.insert(contacts).values({
    id,
    accountId,
    name: extra.name,
    email: `${id.slice(0, 8)}@export-ban.example`,
    addressRaw: extra.addressRaw,
    status: extra.status,
    matchSource: extra.matchSource ?? 'auto',
    noParcelKind: extra.noParcelKind ?? null,
    parcelId: extra.parcelId ?? null,
  })
  return id
}

describe.skipIf(!sessionUrl)('OR-008 admin matching', { timeout: 120_000 }, () => {
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

  test('seeded mix, export, write paths, and agent 404', async () => {
    const adminId = await register('Ada Admin', 'admin')
    const homeworkId = await register('Homework Homes')
    const cleanId = await register('Clean Coast')
    const writerId = await register('Write Paths')
    const house = await insertHouse('410 Adminoak Ave', `OR008-${randomUUID().slice(0, 8)}`)
    const other = await insertHouse('412 Adminoak Ave', `OR008-${randomUUID().slice(0, 8)}`)

    await insertPerson(homeworkId, {
      name: 'Zelda Homework',
      addressRaw: '410 Adminoak Ave, La Verne, CA 91991',
      status: 'matched',
      matchSource: 'auto',
      parcelId: house,
    })
    await insertPerson(homeworkId, {
      name: 'Review Pick',
      addressRaw: '411 Adminoak Ave, La Verne, CA 91991',
      status: 'matched',
      matchSource: 'review',
      parcelId: house,
    })
    await insertPerson(homeworkId, {
      name: 'Needs Look',
      addressRaw: '1846 Adminoak Ave, La Verne, CA 91991',
      status: 'needs_review',
    })
    await insertPerson(homeworkId, {
      name: 'Lost House',
      addressRaw: '9999 Unknown Ridge, Nowhere, CA 00000',
      status: 'no_parcel',
      noParcelKind: 'unmatched',
    })
    await insertPerson(homeworkId, {
      name: 'Box Person',
      addressRaw: 'PO Box 88, La Verne, CA 91991',
      status: 'no_parcel',
      noParcelKind: 'non_address',
    })
    await insertPerson(homeworkId, {
      name: 'Wrong House',
      addressRaw: '412 Adminoak Ave, La Verne, CA 91991',
      status: 'matched',
      matchSource: 'corrected',
      parcelId: other,
    })
    await insertPerson(cleanId, {
      name: 'Auto One',
      addressRaw: '410 Adminoak Ave, La Verne, CA 91991',
      status: 'matched',
      matchSource: 'auto',
      parcelId: house,
    })
    await insertPerson(cleanId, {
      name: 'Auto Two',
      addressRaw: '410 Adminoak Ave Unit 2, La Verne, CA 91991',
      status: 'matched',
      matchSource: 'auto',
      parcelId: house,
    })
    await insertPerson(cleanId, {
      name: 'Auto Three',
      addressRaw: '410 Adminoak Ave Unit 3, La Verne, CA 91991',
      status: 'matched',
      matchSource: 'auto',
      parcelId: house,
    })
    await insertPerson(cleanId, {
      name: 'City Only',
      addressRaw: 'La Verne',
      status: 'no_parcel',
      noParcelKind: 'non_address',
    })

    const asAgent = await listMatchingOverviewForAdmin(homeworkId)
    expect(asAgent.overall.street).toBe(0)
    expect(asAgent.accounts).toEqual([])
    expect(await listMatchingFailuresForAdmin(homeworkId, {})).toEqual([])

    const overview = await listMatchingOverviewForAdmin(adminId)
    const homework = overview.accounts.find((row) => row.accountId === homeworkId)
    const clean = overview.accounts.find((row) => row.accountId === cleanId)
    expect(homework).toMatchObject({ street: 5, autoMatched: 1, matched: 3 })
    expect(clean).toMatchObject({ street: 3, autoMatched: 3, matched: 3 })
    const order = overview.accounts.map((row) => row.accountId)
    expect(order.indexOf(homeworkId)).toBeLessThan(order.indexOf(cleanId))
    expect(homework?.autoMatchRate).toBe(1 / 5)
    expect(homework?.finalCoverage).toBe(3 / 5)
    expect(clean?.autoMatchRate).toBe(1)

    const failures = await listMatchingFailuresForAdmin(adminId, {})
    const ours = failures.filter((row) => [homeworkId, cleanId].includes(row.accountId))
    expect(ours).toHaveLength(3)
    expect(ours.map((row) => row.status).sort()).toEqual(['matched', 'needs_review', 'no_parcel'])
    expect(ours.some((row) => row.matchSource === 'corrected')).toBe(true)
    expect(ours.every((row) => !('name' in row) && !('email' in row))).toBe(true)

    const payload = fixturesToJson(ours)
    JSON.parse(payload)
    expect(payload).not.toMatch(/Zelda Homework|Review Pick|Needs Look|Lost House|Wrong House/)
    expect(payload).not.toMatch(/@export-ban\.example/i)
    expect(payload).toContain('1846 Adminoak Ave')
    expect(payload).toContain('"expect": "needs_review"')

    const filtered = await listMatchingFailuresForAdmin(adminId, { status: 'corrected' })
    expect(filtered.every((row) => row.matchSource === 'corrected')).toBe(true)

    const { db } = getRuntimeDb()
    await importContacts(db, writerId, [
      {
        line: 1,
        name: 'Imported Box',
        email: `box-${randomUUID()}@example.com`,
        address: 'PO Box 12, La Verne, CA 91991',
        closeDate: null,
      },
    ])
    const [imported] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.accountId, writerId)))
    expect(imported?.matchSource).toBe('auto')
    expect(imported?.noParcelKind).toBe('non_address')

    const reviewId = await insertPerson(writerId, {
      name: 'Queue Pick',
      addressRaw: '411 Adminoak Ave, La Verne, CA 91991',
      status: 'needs_review',
    })
    await persistContactCandidates(
      db,
      reviewId,
      [{ parcelId: house, confidence: 0.8, reason: 'Close', rank: 1 }],
      'replace',
    )
    const chosen = await chooseCandidateForAccount(writerId, reviewId, house)
    expect(chosen.ok).toBe(true)
    const [afterReview] = await db.select().from(contacts).where(eq(contacts.id, reviewId))
    expect(afterReview?.matchSource).toBe('review')

    const matchedId = await insertPerson(writerId, {
      name: 'Already Mapped',
      addressRaw: '410 Adminoak Ave, La Verne, CA 91991',
      status: 'matched',
      parcelId: house,
    })
    await persistContactCandidates(
      db,
      matchedId,
      [{ parcelId: other, confidence: 0.7, reason: 'Nearby', rank: 1 }],
      'replace',
    )
    const corrected = await chooseCandidateForAccount(writerId, matchedId, other)
    expect(corrected.ok).toBe(true)
    const [afterWrong] = await db.select().from(contacts).where(eq(contacts.id, matchedId))
    expect(afterWrong?.matchSource).toBe('corrected')

    const edited = await updateContactForAccount(writerId, reviewId, {
      name: 'Queue Pick',
      email: afterReview?.email ?? `edit-${reviewId}@example.com`,
      phone: null,
      addressRaw: 'PO Box 99, La Verne, CA 91991',
      closeDate: null,
      notes: null,
    })
    expect(edited.ok).toBe(true)
    const [afterEdit] = await db.select().from(contacts).where(eq(contacts.id, reviewId))
    expect(afterEdit?.matchSource).toBe('auto')
    expect(afterEdit?.noParcelKind).toBe('non_address')
  })
})
