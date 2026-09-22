import { randomUUID } from 'node:crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { afterAll, describe, expect, test } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import { VIEW_AS_READ_ONLY } from '@/auth/write-guard'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { persistContactCandidates } from '@/db/persist-contact-candidates'
import { withStreetNameNorm } from '@/db/parcel-write'
import { GRANT_DEED_KIND } from '@/db/recorded-owner'
import {
  listReviewQueueForAccount,
  loadWrongHouseReview,
} from '@/db/review-queue'
import {
  chooseCandidateForAccount,
  fixReviewAddressForAccount,
  leaveOutContactForAccount,
  undoReviewChangeForAccount,
} from '@/db/review-write'
import { getRuntimeDb } from '@/db/runtime'
import {
  accounts,
  contactMatchCandidates,
  contacts,
  parcelEvents,
  parcels,
} from '@/db/schema'
import { reviewHeader } from '@/people/review-state'
import {
  chooseReviewCandidate,
  leaveOutReviewContact,
} from '@/people/save-review'
import { resolveAddressMatch } from '@/matching/resolve-match'

const sessionUrl = tryLoadIntegrationDatabaseUrl()

const accountIds: string[] = []
const parcelIds: string[] = []
const eventIds: string[] = []

async function newAccount() {
  const created = await registerAccount({
    name: 'Review Tester',
    email: `or007-${randomUUID()}@example.com`,
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

function writable(accountId: string) {
  return { accountId, role: 'agent' as const, exp: Math.floor(Date.now() / 1000) + 60 }
}

function viewing(accountId: string) {
  return {
    accountId,
    role: 'admin' as const,
    viewingAsAccountId: accountId,
    exp: Math.floor(Date.now() / 1000) + 60,
  }
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
      beds: 3,
      baths: '2.0',
      sqft: 1600,
    }),
  )
  parcelIds.push(id)
  return id
}

async function insertGrantDeed(parcelId: string, party: string, recordedAt: string) {
  const { db } = getRuntimeDb()
  const id = randomUUID()
  await db.insert(parcelEvents).values({
    id,
    parcelId,
    county: 'Los Angeles',
    kind: GRANT_DEED_KIND,
    docNumber: `OR007${id.slice(0, 8)}`,
    recordedAt,
    amount: 625000,
    party,
    raw: { source: 'or-007-test' },
  })
  eventIds.push(id)
  return id
}

async function insertPerson(
  accountId: string,
  extra?: Partial<{
    name: string
    addressRaw: string
    status: 'matched' | 'needs_review' | 'no_parcel'
    reviewState: 'pending' | 'reviewed'
    parcelId: string | null
  }>,
) {
  const { db } = getRuntimeDb()
  const id = randomUUID()
  await db.insert(contacts).values({
    id,
    accountId,
    name: extra?.name ?? 'Pat Rivera',
    email: `pat-${id.slice(0, 8)}@example.com`,
    phone: '9095550147',
      addressRaw: extra?.addressRaw ?? 'PO Box 99, La Verne, CA 91991',
    status: extra?.status ?? 'no_parcel',
    reviewState: extra?.reviewState ?? 'pending',
    parcelId: extra?.parcelId ?? null,
  })
  return id
}

async function seedReviewContact(accountId: string, name: string, addressRaw: string) {
  const { db } = getRuntimeDb()
  const contactId = await insertPerson(accountId, {
    name,
    addressRaw,
    status: 'needs_review',
  })
  const match = await resolveAddressMatch(db, addressRaw)
  expect(match.status).toBe('needs_review')
  expect(match.candidates.length).toBeGreaterThan(0)
  await persistContactCandidates(db, contactId, match.candidates, 'replace')
  await db
    .update(contacts)
    .set({ status: match.status, parcelId: match.parcelId })
    .where(eq(contacts.id, contactId))
  return { contactId, match }
}

describe.skipIf(!sessionUrl)('OR-007 review queue', { timeout: 120_000 }, () => {
  afterAll(async () => {
    if (!sessionUrl) return
    const { db } = getRuntimeDb()
    if (eventIds.length) {
      await db.delete(parcelEvents).where(inArray(parcelEvents.id, eventIds))
    }
    if (accountIds.length) {
      await db.delete(contacts).where(inArray(contacts.accountId, accountIds))
      await db.delete(accounts).where(inArray(accounts.id, accountIds))
    }
    if (parcelIds.length) {
      await db.delete(parcels).where(inArray(parcels.id, parcelIds))
    }
  })

  test('queue, choose, leave out, undo, rematch, and wrong house', async () => {
    const left = await insertHouse('410 Reviewoak Ave', `OR007-L-${randomUUID().slice(0, 8)}`)
    const right = await insertHouse('412 Reviewoak Ave', `OR007-R-${randomUUID().slice(0, 8)}`)
    await insertGrantDeed(left, 'Anita Flores', '2023-01-15')
    await insertGrantDeed(left, 'James Whitaker', '2015-04-01')
    await insertGrantDeed(right, 'Robert Chen', '2018-04-02')

    const accountId = await newAccount()
    const otherId = await newAccount()
    await insertPerson(accountId, {
      name: 'Helen Leftout',
      addressRaw: 'PO Box 1, La Verne, CA 91991',
      status: 'no_parcel',
      reviewState: 'reviewed',
    })
    await insertPerson(accountId, {
      name: 'On The Map',
      addressRaw: '410 Reviewoak Ave, La Verne, CA 91991',
      status: 'matched',
      parcelId: left,
    })
    const pending = await insertPerson(accountId, {
      name: 'Zoe Pending',
      addressRaw: 'PO Box 2, La Verne, CA 91991',
      status: 'no_parcel',
      reviewState: 'pending',
    })
    const { contactId, match } = await seedReviewContact(
      accountId,
      'Anita Flores',
      '411 Reviewoak Ave, La Verne, CA 91991',
    )

    const queue = await listReviewQueueForAccount(accountId)
    expect(queue.map((row) => row.name)).toEqual(['Anita Flores', 'Zoe Pending'])
    expect(reviewHeader(1, queue.length)).toBe('Needs a look · 1 of 2')
    const anita = queue[0]
    expect(anita.candidates.length).toBeGreaterThanOrEqual(2)
    expect(anita.candidates.length).toBeLessThanOrEqual(3)
    const leftCard = anita.candidates.find((card) => card.parcelId === left)
    expect(leftCard?.recordedOwner).toBe('Anita Flores')
    expect(leftCard?.nameMatches).toBe(true)
    const rightCard = anita.candidates.find((card) => card.parcelId === right)
    expect(rightCard?.recordedOwner).toBe('Robert Chen')
    expect(rightCard?.nameMatches).toBe(false)
    expect(leftCard?.street).toBe('410 Reviewoak Ave')
    expect(leftCard?.reason).toBeTruthy()

    const isolated = await chooseCandidateForAccount(otherId, contactId, match.candidates[0].parcelId)
    expect(isolated.ok).toBe(false)

    const chosen = await chooseCandidateForAccount(accountId, contactId, left)
    expect(chosen.ok).toBe(true)
    if (!chosen.ok) return
    const { db } = getRuntimeDb()
    const [afterChoose] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.accountId, accountId)))
    expect(afterChoose?.status).toBe('matched')
    expect(afterChoose?.parcelId).toBe(left)
    const leftover = await db
      .select()
      .from(contactMatchCandidates)
      .where(eq(contactMatchCandidates.contactId, contactId))
    expect(leftover).toHaveLength(0)
    expect((await listReviewQueueForAccount(accountId)).map((row) => row.name)).toEqual([
      'Zoe Pending',
    ])

    const undone = await undoReviewChangeForAccount(accountId, chosen.snapshot)
    expect(undone.ok).toBe(true)
    const [afterUndo] = await db.select().from(contacts).where(eq(contacts.id, contactId))
    expect(afterUndo?.status).toBe('needs_review')
    expect(afterUndo?.parcelId).toBeNull()
    expect(afterUndo?.reviewState).toBe('pending')
    const restored = await db
      .select()
      .from(contactMatchCandidates)
      .where(eq(contactMatchCandidates.contactId, contactId))
    expect(restored.length).toBe(match.candidates.length)

    const leftOut = await leaveOutContactForAccount(accountId, pending)
    expect(leftOut.ok).toBe(true)
    const [afterLeave] = await db.select().from(contacts).where(eq(contacts.id, pending))
    expect(afterLeave?.status).toBe('no_parcel')
    expect(afterLeave?.reviewState).toBe('reviewed')
    expect((await listReviewQueueForAccount(accountId)).map((row) => row.name)).toEqual([
      'Anita Flores',
    ])

    if (leftOut.ok) {
      await undoReviewChangeForAccount(accountId, leftOut.snapshot)
    }

    const rematch = await fixReviewAddressForAccount(
      accountId,
      pending,
      '410 Reviewoak Ave, La Verne, CA 91991',
    )
    expect(rematch.ok).toBe(true)
    if (rematch.ok) expect(rematch.item).toBeNull()
    const [afterFix] = await db.select().from(contacts).where(eq(contacts.id, pending))
    expect(afterFix?.status).toBe('matched')
    expect(afterFix?.parcelId).toBe(left)

    const matchedId = await insertPerson(accountId, {
      name: 'Wrong House',
      addressRaw: '410 Reviewoak Ave, La Verne, CA 91991',
      status: 'matched',
      parcelId: left,
    })
    const wrong = await loadWrongHouseReview(accountId, matchedId)
    expect(wrong).toBeTruthy()
    expect(wrong?.candidates.every((card) => card.parcelId !== left)).toBe(true)
    expect(wrong?.candidates.some((card) => card.parcelId === right)).toBe(true)
    const corrected = await chooseCandidateForAccount(accountId, matchedId, right)
    expect(corrected.ok).toBe(true)
    const [afterWrong] = await db.select().from(contacts).where(eq(contacts.id, matchedId))
    expect(afterWrong?.status).toBe('matched')
    expect(afterWrong?.parcelId).toBe(right)
  })

  test('view-as cannot choose or leave someone out', async () => {
    const accountId = await newAccount()
    const personId = await insertPerson(accountId)
    const form = new FormData()
    form.set('contactId', personId)
    form.set('parcelId', randomUUID())
    expect(await chooseReviewCandidate(viewing(accountId), form)).toEqual({
      error: VIEW_AS_READ_ONLY,
    })
    expect(await leaveOutReviewContact(viewing(accountId), form)).toEqual({
      error: VIEW_AS_READ_ONLY,
    })
    expect(await chooseReviewCandidate(writable(accountId), form)).toMatchObject({
      error: expect.any(String),
    })
  })
})
