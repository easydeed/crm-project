import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { loadDatabaseUrl } from '@/config/database-url'
import { createDb } from '@/db/client'
import {
  accounts,
  contacts,
  groupMembers,
  groups,
  parcelEvents,
  parcels,
} from '@/db/schema'

let databaseUrl: string | null = null
try {
  databaseUrl = loadDatabaseUrl()
} catch {
  databaseUrl = null
}

describe.skipIf(!databaseUrl)('live constraints', () => {
  const ids = {
    accountA: randomUUID(),
    accountB: randomUUID(),
    contact: randomUUID(),
    otherContact: randomUUID(),
    group: randomUUID(),
    parcel: randomUUID(),
    eventA: randomUUID(),
    eventB: randomUUID(),
  }

  const handle = databaseUrl ? createDb(databaseUrl) : null

  function db() {
    if (!handle) throw new Error('DATABASE_URL is not set')
    return handle.db
  }

  beforeAll(async () => {
    await db().insert(accounts).values([
      {
        id: ids.accountA,
        email: `constraint-a-${ids.accountA}@example.com`,
        passwordHash: '!test',
        name: 'Constraint A',
        role: 'agent',
      },
      {
        id: ids.accountB,
        email: `constraint-b-${ids.accountB}@example.com`,
        passwordHash: '!test',
        name: 'Constraint B',
        role: 'agent',
      },
    ])
  })

  afterAll(async () => {
    if (!handle) return
    await handle.db.delete(parcelEvents).where(eq(parcelEvents.parcelId, ids.parcel))
    await handle.db.delete(parcels).where(eq(parcels.id, ids.parcel))
    await handle.db.delete(groupMembers).where(eq(groupMembers.groupId, ids.group))
    await handle.db.delete(groups).where(eq(groups.id, ids.group))
    await handle.db.delete(contacts).where(eq(contacts.accountId, ids.accountA))
    await handle.db.delete(contacts).where(eq(contacts.accountId, ids.accountB))
    await handle.db.delete(accounts).where(eq(accounts.id, ids.accountA))
    await handle.db.delete(accounts).where(eq(accounts.id, ids.accountB))
    await handle.client.end({ timeout: 2 })
  })

  test('duplicate email on the same account is rejected', async () => {
    await db().insert(contacts).values({
      id: ids.contact,
      accountId: ids.accountA,
      name: 'Same Account',
      email: 'Shared.Person@example.com',
      addressRaw: '1 Test St',
      status: 'no_parcel',
    })

    await expect(
      db().insert(contacts).values({
        id: randomUUID(),
        accountId: ids.accountA,
        name: 'Same Account Again',
        email: 'shared.person@example.com',
        addressRaw: '2 Test St',
        status: 'no_parcel',
      }),
    ).rejects.toThrow()
  })

  test('the same email on a different account is accepted', async () => {
    ids.otherContact = randomUUID()
    await db().insert(contacts).values({
      id: ids.otherContact,
      accountId: ids.accountB,
      name: 'Other Account',
      email: 'Shared.Person@example.com',
      addressRaw: '3 Test St',
      status: 'no_parcel',
    })

    const [row] = await db()
      .select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.id, ids.otherContact))
    expect(row?.id).toBe(ids.otherContact)
  })

  test('deleting a contact cascades its group_members rows', async () => {
    await db().insert(groups).values({
      id: ids.group,
      accountId: ids.accountA,
      name: 'Cascade Group',
    })
    await db().insert(groupMembers).values({
      groupId: ids.group,
      contactId: ids.contact,
    })

    await db().delete(contacts).where(eq(contacts.id, ids.contact))

    const leftover = await db()
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, ids.group))
    expect(leftover).toHaveLength(0)
  })

  test('duplicate (county, doc_number) parcel_event is rejected', async () => {
    await db().insert(parcels).values({
      id: ids.parcel,
      apn: `TEST-${ids.parcel.slice(0, 8)}`,
      county: 'Los Angeles',
      address: '9 Test Ave',
      city: 'La Verne',
      zip: '91750',
    })
    await db().insert(parcelEvents).values({
      id: ids.eventA,
      parcelId: ids.parcel,
      county: 'Los Angeles',
      kind: 'grant_deed',
      docNumber: 'TEST-DOC-0001',
      recordedAt: '2024-01-01',
    })

    await expect(
      db().insert(parcelEvents).values({
        id: ids.eventB,
        parcelId: ids.parcel,
        county: 'Los Angeles',
        kind: 'grant_deed',
        docNumber: 'TEST-DOC-0001',
        recordedAt: '2024-02-02',
      }),
    ).rejects.toThrow()
  })
})
