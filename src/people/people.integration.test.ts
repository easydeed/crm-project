import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, describe, expect, test } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import { VIEW_AS_READ_ONLY } from '@/auth/write-guard'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getContactForAccount, listContactsForAccount } from '@/db/contacts'
import { deleteContactsForAccount, updateContactForAccount } from '@/db/contact-write'
import {
  addContactsToGroup,
  createGroupForAccount,
  deleteGroupForAccount,
  listGroupsForAccount,
  renameGroupForAccount,
} from '@/db/groups'
import { withStreetNameNorm } from '@/db/parcel-write'
import { getRuntimeDb } from '@/db/runtime'
import {
  accounts,
  contactMatchCandidates,
  contacts,
  groupMembers,
  groups,
  parcels,
} from '@/db/schema'
import { contactMatchesSearch } from '@/people/filter'
import { deleteContact, saveContact } from '@/people/save-contact'
import { createGroup } from '@/people/save-groups'

const sessionUrl = tryLoadIntegrationDatabaseUrl()

const accountIds: string[] = []
const parcelIds: string[] = []

async function newAccount() {
  const created = await registerAccount({
    name: 'People Tester',
    email: `or006-${randomUUID()}@example.com`,
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

async function insertPerson(
  accountId: string,
  extra?: Partial<{
    name: string
    email: string
    phone: string | null
    addressRaw: string
    closeDate: string | null
    notes: string | null
    status: 'matched' | 'needs_review' | 'no_parcel'
    parcelId: string | null
  }>,
) {
  const { db } = getRuntimeDb()
  const id = randomUUID()
  await db.insert(contacts).values({
    id,
    accountId,
    name: extra?.name ?? 'Pat Rivera',
    email: extra?.email ?? `pat-${id.slice(0, 8)}@example.com`,
    phone: extra?.phone ?? '9095550147',
    addressRaw: extra?.addressRaw ?? 'PO Box 99, La Verne, CA 91750',
    closeDate: extra?.closeDate ?? '2021-03-15',
    notes: extra?.notes ?? 'Past client',
    status: extra?.status ?? 'no_parcel',
    parcelId: extra?.parcelId ?? null,
  })
  return id
}

async function ensureTestParcel() {
  const { db } = getRuntimeDb()
  const id = randomUUID()
  await db.insert(parcels).values(
    withStreetNameNorm({
      id,
      apn: `OR006-${id.slice(0, 8)}`,
      county: 'Los Angeles',
      address: '100 Test Ave',
      city: 'La Verne',
      zip: '91992',
    }),
  )
  parcelIds.push(id)
  return id
}

async function ensureReviewStreet() {
  const { db } = getRuntimeDb()
  for (const address of ['1840 Peopleoak Ave', '1852 Peopleoak Ave']) {
    const id = randomUUID()
    await db.insert(parcels).values(
      withStreetNameNorm({
        id,
        apn: `OR006-${id.slice(0, 8)}`,
        county: 'Los Angeles',
        address,
        city: 'La Verne',
        zip: '91992',
      }),
    )
    parcelIds.push(id)
  }
}

describe.skipIf(!sessionUrl)('OR-006 people list', { timeout: 120_000 }, () => {
  afterAll(async () => {
    if (!sessionUrl) return
    const { db } = getRuntimeDb()
    if (accountIds.length) {
      await db.delete(contacts).where(inArray(contacts.accountId, accountIds))
      await db.delete(groups).where(inArray(groups.accountId, accountIds))
      await db.delete(accounts).where(inArray(accounts.id, accountIds))
    }
    if (parcelIds.length) {
      await db.delete(parcels).where(inArray(parcels.id, parcelIds))
    }
  })

  test('list includes phone and is not truncated at 250', async () => {
    const accountId = await newAccount()
    const lastEmail = `zebra-${randomUUID()}@example.com`
    const { db } = getRuntimeDb()
    await db.insert(contacts).values(
      Array.from({ length: 250 }, (_, i) => ({
        id: randomUUID(),
        accountId,
        name: i === 249 ? 'Zebra Lastperson' : `Cap ${String(i).padStart(3, '0')}`,
        email: i === 249 ? lastEmail : `cap-${i}-${randomUUID()}@example.com`,
        phone: '9095550100',
        addressRaw:
          i === 249
            ? '999 Hidden End, La Verne, CA 91750'
            : `${100 + i} Main St, La Verne, CA 91750`,
        status: 'no_parcel' as const,
      })),
    )
    const rows = await listContactsForAccount(accountId)
    expect(rows).toHaveLength(250)
    expect(rows.every((row) => row.phone)).toBe(true)
    const last = rows.find((row) => row.name === 'Zebra Lastperson')
    expect(last?.email).toBe(lastEmail)
    expect(last?.phone).toBe('9095550100')
    expect(rows.filter((row) => contactMatchesSearch(row, 'Zebra Lastperson'))).toEqual([
      last,
    ])
  })

  test('groups create, rename, delete, and never delete people', async () => {
    const accountId = await newAccount()
    const personId = await insertPerson(accountId)
    expect(await listGroupsForAccount(accountId)).toEqual([])

    const created = await createGroupForAccount(accountId, 'Buyers')
    expect(created.ok).toBe(true)
    if (!created.ok) return
    await addContactsToGroup(accountId, created.group.id, [personId])
    const listed = await listGroupsForAccount(accountId)
    expect(listed).toEqual([{ id: created.group.id, name: 'Buyers', count: 1 }])

    const renamed = await renameGroupForAccount(accountId, created.group.id, 'Past clients')
    expect(renamed.ok).toBe(true)
    const afterRename = await deleteGroupForAccount(accountId, created.group.id)
    expect(afterRename.ok).toBe(true)
    expect(await listGroupsForAccount(accountId)).toEqual([])
    const stillThere = await getContactForAccount(accountId, personId)
    expect(stillThere?.name).toBe('Pat Rivera')
    const { db } = getRuntimeDb()
    const leftover = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.contactId, personId))
    expect(leftover).toHaveLength(0)
  })

  test('address edit rematches and persists candidates the import way', async () => {
    await ensureTestParcel()
    await ensureReviewStreet()
    const accountId = await newAccount()
    const personId = await insertPerson(accountId, {
      addressRaw: 'PO Box 99, La Verne, CA 91750',
      status: 'no_parcel',
    })

    const matched = await updateContactForAccount(accountId, personId, {
      name: 'Pat Rivera',
      email: `pat-match-${personId.slice(0, 8)}@example.com`,
      phone: '9095550147',
      addressRaw: '100 Test Ave, La Verne, CA 91992',
      closeDate: '2021-03-15',
      notes: 'Past client',
    })
    expect(matched).toEqual({ ok: true, rematched: true })
    const afterMatch = await getContactForAccount(accountId, personId)
    expect(afterMatch?.status).toBe('matched')
    expect(afterMatch?.parcelId).toBeTruthy()
    expect(afterMatch?.parcelApn).toBeTruthy()
    expect(afterMatch?.phone).toBe('9095550147')

    const review = await updateContactForAccount(accountId, personId, {
      name: 'Pat Rivera',
      email: afterMatch?.email ?? '',
      phone: '9095550147',
      addressRaw: '1846 Peopleoak Ave, La Verne, CA 91992',
      closeDate: '2021-03-15',
      notes: 'Past client',
    })
    expect(review).toEqual({ ok: true, rematched: true })
    const afterReview = await getContactForAccount(accountId, personId)
    expect(afterReview?.status).toBe('needs_review')
    expect(afterReview?.candidates.length).toBeGreaterThan(0)
    const { db } = getRuntimeDb()
    const stored = await db
      .select()
      .from(contactMatchCandidates)
      .where(eq(contactMatchCandidates.contactId, personId))
    expect(stored.length).toBe(afterReview?.candidates.length)
  })

  test('hard delete names the person path and cascades members and candidates', async () => {
    await ensureReviewStreet()
    const accountId = await newAccount()
    const personId = await insertPerson(accountId, {
      name: 'Jordan Hale',
      addressRaw: '1846 Peopleoak Ave, La Verne, CA 91992',
      status: 'needs_review',
    })
    const created = await createGroupForAccount(accountId, 'Cascade')
    expect(created.ok).toBe(true)
    if (!created.ok) return
    await addContactsToGroup(accountId, created.group.id, [personId])
    await updateContactForAccount(accountId, personId, {
      name: 'Jordan Hale',
      email: `jordan-${personId.slice(0, 8)}@example.com`,
      phone: '9095550147',
      addressRaw: '1846 Peopleoak Ave, La Verne, CA 91992',
      closeDate: '2021-03-15',
      notes: null,
    })

    const form = new FormData()
    form.set('contactId', personId)
    const result = await deleteContact(writable(accountId), form)
    expect(result).toEqual({ deleted: true })

    const { db } = getRuntimeDb()
    expect(await getContactForAccount(accountId, personId)).toBeNull()
    const members = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.contactId, personId))
    const leftover = await db
      .select()
      .from(contactMatchCandidates)
      .where(eq(contactMatchCandidates.contactId, personId))
    expect(members).toHaveLength(0)
    expect(leftover).toHaveLength(0)
    const groupStill = await db.select().from(groups).where(eq(groups.id, created.group.id))
    expect(groupStill).toHaveLength(1)
  })

  test('view-as cannot edit, delete, or make a group', async () => {
    const accountId = await newAccount()
    const personId = await insertPerson(accountId)
    const edit = new FormData()
    edit.set('contactId', personId)
    edit.set('name', 'Should Not Persist')
    edit.set('email', `blocked-${personId.slice(0, 8)}@example.com`)
    edit.set('phone', '909-555-0199')
    edit.set('address', '1840 Oakdale Ave, La Verne, CA 91750')
    edit.set('closeDate', '2021-03-15')
    edit.set('notes', 'nope')
    expect(await saveContact(viewing(accountId), edit)).toEqual({
      error: VIEW_AS_READ_ONLY,
    })

    const remove = new FormData()
    remove.set('contactId', personId)
    expect(await deleteContact(viewing(accountId), remove)).toEqual({
      error: VIEW_AS_READ_ONLY,
    })

    const group = new FormData()
    group.set('name', 'Should Not Exist')
    expect(await createGroup(viewing(accountId), group)).toEqual({
      error: VIEW_AS_READ_ONLY,
    })

    const person = await getContactForAccount(accountId, personId)
    expect(person?.name).toBe('Pat Rivera')
    expect(await listGroupsForAccount(accountId)).toEqual([])
  })

  test('account isolation on get and delete', async () => {
    const accountA = await newAccount()
    const accountB = await newAccount()
    const personId = await insertPerson(accountA, { name: 'Only A' })
    expect(await getContactForAccount(accountB, personId)).toBeNull()
    expect(await deleteContactsForAccount(accountB, [personId])).toBe(0)
    expect(await getContactForAccount(accountA, personId)).toMatchObject({ name: 'Only A' })
  })
})
