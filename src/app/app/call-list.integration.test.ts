import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { loadCallList } from '@/app/app/call-list-data'
import { loadHomeSend } from '@/app/app/home-send'
import { registerAccount } from '@/auth/register-account'
import { withStreetNameNorm } from '@/db/parcel-write'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import { accounts, contacts, parcels } from '@/db/schema'
import { callListEntries } from '@/db/schema-call-lists'

const databaseUrl = tryLoadIntegrationDatabaseUrl()
const now = new Date('2026-09-20T18:00:00.000Z')

describe.skipIf(!databaseUrl)('dashboard call list against the session pooler', () => {
  const accountIds: string[] = []
  const contactIds: string[] = []
  const parcelIds: string[] = []

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
  })

  afterAll(async () => {
    const { db, client } = getRuntimeDb()
    for (const id of accountIds) await db.delete(callListEntries).where(eq(callListEntries.accountId, id))
    for (const id of contactIds) await db.delete(contacts).where(eq(contacts.id, id))
    for (const id of parcelIds) await db.delete(parcels).where(eq(parcels.id, id))
    for (const id of accountIds) await db.delete(accounts).where(eq(accounts.id, id))
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  async function account(label: string) {
    const created = await registerAccount({
      name: `OR017a ${label}`,
      email: `or017a-${label}-${randomUUID()}@example.com`,
      password: 'long-enough-password',
      brokerage: 'Hill Realty',
      dre: '02001701',
      phone: '909-555-0171',
    })
    if (!created.ok) throw new Error('could not register')
    accountIds.push(created.accountId)
    await getRuntimeDb()
      .db.update(accounts)
      .set({ sendDay: 15, sendTime: '09:00', timezone: 'America/Los_Angeles' })
      .where(eq(accounts.id, created.accountId))
    return created.accountId
  }

  async function person(accountId: string, name: string, matched: boolean) {
    const { db } = getRuntimeDb()
    const parcelId = randomUUID()
    const address = `${100 + contactIds.length} Or017a ${parcelId.slice(0, 6)} St`
    if (matched) {
      await db.insert(parcels).values(
        withStreetNameNorm({
          id: parcelId,
          apn: `OR017A-${parcelId.slice(0, 8)}`,
          county: 'Los Angeles',
          address,
          city: 'La Verne',
          zip: '91750',
        }),
      )
      parcelIds.push(parcelId)
    }
    const id = randomUUID()
    await db.insert(contacts).values({
      id,
      accountId,
      name,
      email: `or017a-${id.slice(0, 8)}@example.com`,
      addressRaw: `${address}, La Verne, CA 91750`,
      parcelId: matched ? parcelId : null,
      closeDate: '2018-05-10',
      status: matched ? 'matched' : 'needs_review',
    })
    contactIds.push(id)
    return { id, address }
  }

  test('no people, then people with no match, name the missing step', async () => {
    const accountId = await account('empty')
    expect(await loadCallList(accountId, now)).toEqual({ kind: 'no-people' })
    await person(accountId, 'Unmatched Person', false)
    expect(await loadCallList(accountId, now)).toEqual({ kind: 'no-matches' })
  })

  test('a paused account keeps this month’s list, unpadded, and ignores other months', async () => {
    const accountId = await account('paused')
    const { db } = getRuntimeDb()
    await db.update(accounts).set({ paused: true }).where(eq(accounts.id, accountId))
    const dana = await person(accountId, 'Dana Ruiz', true)
    const old = await person(accountId, 'Old Month', true)
    await db.insert(callListEntries).values([
      { accountId, contactId: dana.id, kind: 'loan_paid_off', detail: 'Their loan was paid off.', score: 150, period: '2026-09' },
      { accountId, contactId: old.id, kind: 'quiet_a_while', detail: 'Old.', score: 30, period: '2026-08' },
    ])

    expect((await loadHomeSend(accountId, now)).kind).toBe('paused')
    const list = await loadCallList(accountId, now)
    expect(list).toEqual({
      kind: 'list',
      quiet: true,
      entries: [
        {
          contactId: dana.id,
          name: 'Dana Ruiz',
          kind: 'loan_paid_off',
          sentence: 'Their loan was paid off.',
          address: dana.address,
          closeDate: 'May 10, 2018',
          called: false,
          panel: { phone: null, email: expect.stringContaining('@example.com'), record: [], loan: [] },
        },
      ],
    })
  })
})
