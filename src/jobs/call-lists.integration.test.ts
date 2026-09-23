import { randomUUID } from 'node:crypto'
import { and, eq, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import { withStreetNameNorm } from '@/db/parcel-write'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import { accounts, contactSubscriptions, contacts, jobs, parcelEvents, parcels, sends } from '@/db/schema'
import { callListEntries, callLog } from '@/db/schema-call-lists'
import { GRANT_DEED } from '@/digest/types'
import { buildCallLists } from '@/jobs/build-call-lists'
import { scheduleAccountById } from '@/jobs/schedule'

const databaseUrl = tryLoadIntegrationDatabaseUrl()

describe.skipIf(!databaseUrl)('call lists against the session pooler', () => {
  const accountIds: string[] = []
  const parcelIds: string[] = []
  const contactIds: string[] = []

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
  })

  afterAll(async () => {
    const { db, client } = getRuntimeDb()
    for (const accountId of accountIds) {
      await db.delete(callLog).where(eq(callLog.accountId, accountId))
      await db.delete(callListEntries).where(eq(callListEntries.accountId, accountId))
      const sendRows = await db.select({ id: sends.id }).from(sends).where(eq(sends.accountId, accountId))
      for (const send of sendRows) {
        await db.delete(jobs).where(sql`${jobs.payload}->>'sendId' = ${send.id}`)
      }
      await db.delete(jobs).where(sql`${jobs.payload}->>'accountId' = ${accountId}`)
      await db.delete(sends).where(eq(sends.accountId, accountId))
    }
    if (contactIds.length) {
      await db.delete(contactSubscriptions).where(eq(contactSubscriptions.contactId, contactIds[0]!))
      for (const id of contactIds) {
        await db.delete(contactSubscriptions).where(eq(contactSubscriptions.contactId, id))
        await db.delete(contacts).where(eq(contacts.id, id))
      }
    }
    if (parcelIds.length) {
      await db.delete(parcelEvents).where(eq(parcelEvents.parcelId, parcelIds[0]!))
      for (const id of parcelIds) {
        await db.delete(parcelEvents).where(eq(parcelEvents.parcelId, id))
        await db.delete(parcels).where(eq(parcels.id, id))
      }
    }
    for (const id of accountIds) {
      await db.delete(accounts).where(eq(accounts.id, id))
    }
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  test('re-running the job for the same period does not duplicate names', async () => {
    const created = await registerAccount({
      name: 'OR016 Agent',
      email: `or016-${randomUUID()}@example.com`,
      password: 'long-enough-password',
      brokerage: 'Hill Realty',
      dre: '02001616',
      phone: '909-555-0161',
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    accountIds.push(created.accountId)
    const { db } = getRuntimeDb()
    await db
      .update(accounts)
      .set({ sendDay: 15, sendTime: '09:00', timezone: 'America/Los_Angeles' })
      .where(eq(accounts.id, created.accountId))

    const street = `Call ${created.accountId.slice(0, 8)} Ave`
    const homeId = randomUUID()
    const saleId = randomUUID()
    await db.insert(parcels).values([
      withStreetNameNorm({
        id: homeId,
        apn: `OR016-H-${homeId.slice(0, 8)}`,
        county: 'Los Angeles',
        address: `1100 ${street}`,
        city: 'La Verne',
        zip: '91750',
        assessedValue: null,
      }),
      withStreetNameNorm({
        id: saleId,
        apn: `OR016-S-${saleId.slice(0, 8)}`,
        county: 'Los Angeles',
        address: `1104 ${street}`,
        city: 'La Verne',
        zip: '91750',
      }),
    ])
    parcelIds.push(homeId, saleId)
    await db.insert(parcelEvents).values({
      parcelId: saleId,
      county: 'Los Angeles',
      kind: GRANT_DEED,
      docNumber: `OR016-${saleId.slice(0, 8)}`,
      recordedAt: '2026-06-05',
      amount: 1_120_000,
      party: 'Neighbor',
    })
    const contactId = randomUUID()
    await db.insert(contacts).values({
      id: contactId,
      accountId: created.accountId,
      name: 'Elena Park',
      email: `or016-elena-${contactId.slice(0, 8)}@example.com`,
      addressRaw: `1100 ${street}, La Verne, CA 91750`,
      parcelId: homeId,
      closeDate: '2016-06-15',
      status: 'matched',
    })
    contactIds.push(contactId)
    await db.insert(contactSubscriptions).values({ contactId, scope: 'monthly' })

    const payload = { accountId: created.accountId, asOf: '2026-06-15T16:00:00.000Z' }
    const ctx = { jobId: 'or016', attempt: 1, now: new Date(payload.asOf) }
    await buildCallLists(payload, ctx)
    await buildCallLists(payload, ctx)

    const rows = await db
      .select()
      .from(callListEntries)
      .where(and(eq(callListEntries.accountId, created.accountId), eq(callListEntries.period, '2026-06')))
    expect(rows).toHaveLength(1)
    expect(rows[0]?.contactId).toBe(contactId)
    expect(rows[0]?.kind).toBe('sold_nearby')
    expect(rows[0]?.detail).toContain('two doors down')
    expect(rows[0]?.detail).toContain('$1,120,000')
    expect(rows[0]?.detail).not.toMatch(/reconveyance/i)
  })

  test('send day enqueues the call list beside the send', async () => {
    const created = await registerAccount({
      name: 'OR016 Scheduler',
      email: `or016-sched-${randomUUID()}@example.com`,
      password: 'long-enough-password',
      brokerage: 'Hill Realty',
      dre: '02001617',
      phone: '909-555-0162',
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    accountIds.push(created.accountId)
    const { db } = getRuntimeDb()
    await db
      .update(accounts)
      .set({ sendDay: 15, sendTime: '09:00', timezone: 'America/Los_Angeles' })
      .where(eq(accounts.id, created.accountId))

    await scheduleAccountById(created.accountId, new Date('2026-09-15T16:00:00.000Z'))
    const queued = await db
      .select()
      .from(jobs)
      .where(
        and(eq(jobs.kind, 'build_call_lists'), sql`${jobs.payload}->>'accountId' = ${created.accountId}`),
      )
    expect(queued).toHaveLength(1)
    expect(queued[0]?.payload).toMatchObject({ accountId: created.accountId })
  })

  test('a paused account still gets a call list and does not get a send', async () => {
    const created = await registerAccount({
      name: 'OR017 Paused',
      email: `or017-paused-${randomUUID()}@example.com`,
      password: 'long-enough-password',
      brokerage: 'Hill Realty',
      dre: '02001717',
      phone: '909-555-0171',
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    accountIds.push(created.accountId)
    const { db } = getRuntimeDb()
    await db
      .update(accounts)
      .set({ paused: true, sendDay: 15, sendTime: '09:00', timezone: 'America/Los_Angeles' })
      .where(eq(accounts.id, created.accountId))

    const now = new Date('2026-09-15T16:00:00.000Z')
    await scheduleAccountById(created.accountId, now)
    const forAccount = sql`${jobs.payload}->>'accountId' = ${created.accountId}`
    const lists = await db.select().from(jobs).where(and(eq(jobs.kind, 'build_call_lists'), forAccount))
    const compose = await db.select().from(jobs).where(and(eq(jobs.kind, 'compose'), forAccount))
    const sendRows = await db.select().from(sends).where(eq(sends.accountId, created.accountId))
    expect(lists).toHaveLength(1)
    expect(compose).toHaveLength(0)
    expect(sendRows).toHaveLength(0)
  })

  test('a contact dismissed last month is left off this month', async () => {
    const created = await registerAccount({
      name: 'OR017 Dismiss',
      email: `or017-dismiss-${randomUUID()}@example.com`,
      password: 'long-enough-password',
      brokerage: 'Hill Realty',
      dre: '02001718',
      phone: '909-555-0172',
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    accountIds.push(created.accountId)
    const { db } = getRuntimeDb()
    await db
      .update(accounts)
      .set({ timezone: 'America/Los_Angeles' })
      .where(eq(accounts.id, created.accountId))
    const parcelId = randomUUID()
    await db.insert(parcels).values(
      withStreetNameNorm({
        id: parcelId,
        apn: `OR017-${parcelId.slice(0, 8)}`,
        county: 'Los Angeles',
        address: `500 Quiet ${parcelId.slice(0, 6)} Ave`,
        city: 'La Verne',
        zip: '91750',
      }),
    )
    parcelIds.push(parcelId)
    const contactId = randomUUID()
    await db.insert(contacts).values({
      id: contactId,
      accountId: created.accountId,
      name: 'Quiet Person',
      email: `or017-quiet-${contactId.slice(0, 8)}@example.com`,
      addressRaw: '500 Quiet Ave',
      parcelId,
      closeDate: '2016-06-15',
      status: 'matched',
    })
    contactIds.push(contactId)
    await db.insert(contactSubscriptions).values({ contactId, scope: 'monthly' })
    await db.insert(callLog).values({
      accountId: created.accountId,
      contactId,
      kind: 'quiet_a_while',
      period: '2026-05',
      outcome: 'dismissed',
    })

    await buildCallLists(
      { accountId: created.accountId, asOf: '2026-06-15T16:00:00.000Z' },
      { jobId: 'or017', attempt: 1, now: new Date('2026-06-15T16:00:00.000Z') },
    )
    const rows = await db
      .select()
      .from(callListEntries)
      .where(eq(callListEntries.accountId, created.accountId))
    expect(rows).toHaveLength(0)
  })
})
