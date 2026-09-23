import { randomUUID } from 'node:crypto'
import { and, eq, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { loadCallList } from '@/app/app/call-list-data'
import { registerAccount } from '@/auth/register-account'
import { listCalledDates, logCall, undoCall } from '@/db/call-log'
import { deleteContactsForAccount } from '@/db/contact-write'
import { withStreetNameNorm } from '@/db/parcel-write'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import { accounts, contactSubscriptions, contacts, jobs, parcelEvents, parcels, sends } from '@/db/schema'
import { callListEntries, callLog } from '@/db/schema-call-lists'
import { DEED_OF_TRUST, GRANT_DEED } from '@/digest/types'
import { buildCallLists } from '@/jobs/build-call-lists'
import { scheduleAccountById } from '@/jobs/schedule'

const databaseUrl = tryLoadIntegrationDatabaseUrl()
const june = new Date('2026-06-15T19:00:00.000Z')
const july = new Date('2026-07-15T19:00:00.000Z')

describe.skipIf(!databaseUrl)('OR-017b call log against the database', () => {
  const accountIds: string[] = []
  const parcelIds: string[] = []

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
  })

  afterAll(async () => {
    const { db, client } = getRuntimeDb()
    for (const accountId of accountIds) {
      await db.delete(callLog).where(eq(callLog.accountId, accountId))
      await db.delete(callListEntries).where(eq(callListEntries.accountId, accountId))
      await db.delete(jobs).where(sql`${jobs.payload}->>'accountId' = ${accountId}`)
      await db.delete(sends).where(eq(sends.accountId, accountId))
      const ids = (await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.accountId, accountId))).map((r) => r.id)
      for (const id of ids) await db.delete(contactSubscriptions).where(eq(contactSubscriptions.contactId, id))
      await db.delete(contacts).where(eq(contacts.accountId, accountId))
    }
    for (const id of parcelIds) await db.delete(parcelEvents).where(eq(parcelEvents.parcelId, id))
    for (const id of parcelIds) await db.delete(parcels).where(eq(parcels.id, id))
    for (const id of accountIds) await db.delete(accounts).where(eq(accounts.id, id))
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  async function account(label: string, paused = false) {
    const created = await registerAccount({
      name: `OR017b ${label}`,
      email: `or017b-${label}-${randomUUID()}@example.com`,
      password: 'long-enough-password',
      brokerage: 'Hill Realty',
      dre: '02001702',
      phone: '909-555-0172',
    })
    if (!created.ok) throw new Error('could not register')
    accountIds.push(created.accountId)
    await getRuntimeDb()
      .db.update(accounts)
      .set({ sendDay: 15, sendTime: '09:00', timezone: 'America/Los_Angeles', paused })
      .where(eq(accounts.id, created.accountId))
    return created.accountId
  }

  /** A matched, subscribed homeowner with nothing new: a "Been a while" candidate. */
  async function homeowner(accountId: string, name: string) {
    const { db } = getRuntimeDb()
    const parcelId = randomUUID()
    await db.insert(parcels).values(
      withStreetNameNorm({
        id: parcelId,
        apn: `OR017B-${parcelId.slice(0, 8)}`,
        county: 'Los Angeles',
        address: `${200 + parcelIds.length} Or017b ${parcelId.slice(0, 6)} Way`,
        city: 'La Verne',
        zip: '91750',
      }),
    )
    parcelIds.push(parcelId)
    const id = randomUUID()
    await db.insert(contacts).values({
      id,
      accountId,
      name,
      email: `or017b-${id.slice(0, 8)}@example.com`,
      phone: '9095550199',
      addressRaw: 'x',
      parcelId,
      closeDate: '2017-04-02',
      status: 'matched',
    })
    await db.insert(contactSubscriptions).values({ contactId: id, scope: 'monthly' })
    return id
  }

  async function build(accountId: string, asOf: Date) {
    await buildCallLists({ accountId, asOf: asOf.toISOString() }, { jobId: 'or017b', attempt: 1, now: asOf })
  }

  async function names(accountId: string, period: string) {
    const rows = await getRuntimeDb()
      .db.select({ contactId: callListEntries.contactId })
      .from(callListEntries)
      .where(and(eq(callListEntries.accountId, accountId), eq(callListEntries.period, period)))
    return rows.map((row) => row.contactId)
  }

  test('both actions persist, and both undo inside the window but not after it', async () => {
    const accountId = await account('actions')
    const ana = await homeowner(accountId, 'Ana Called')
    const ben = await homeowner(accountId, 'Ben Dismissed')
    await build(accountId, june)

    expect(await logCall(accountId, ana, 'called', june)).toEqual({ ok: true })
    expect(await logCall(accountId, ben, 'dismissed', june)).toEqual({ ok: true })
    let list = await loadCallList(accountId, june)
    if (list.kind !== 'list') throw new Error('expected a list')
    expect(list.entries.map((e) => [e.contactId, e.called])).toEqual([[ana, true]])
    expect(list.entries[0]?.panel).toMatchObject({ phone: '9095550199' })

    const soon = new Date(june.getTime() + 4_000)
    expect(await undoCall(accountId, ana, soon)).toEqual({ ok: true })
    expect(await undoCall(accountId, ben, soon)).toEqual({ ok: true })
    list = await loadCallList(accountId, june)
    if (list.kind !== 'list') throw new Error('expected a list')
    expect(list.entries.map((e) => e.called).sort()).toEqual([false, false])

    await logCall(accountId, ana, 'called', june)
    const late = new Date(june.getTime() + 60_000)
    expect((await undoCall(accountId, ana, late)).ok).toBe(false)
    expect(await listCalledDates(accountId, ana)).toHaveLength(1)
  })

  test('a dismissed contact is suppressed next month, even without a stored entry', async () => {
    const accountId = await account('suppress')
    const shown = await homeowner(accountId, 'Shown Dismissed')
    const logOnly = await homeowner(accountId, 'Log Only Dismissed')
    await build(accountId, june)
    expect(await names(accountId, '2026-06')).toContain(shown)
    await logCall(accountId, shown, 'dismissed', june)

    // A dismissal with no matching entry must still count as shown.
    const { db } = getRuntimeDb()
    await db.delete(callListEntries).where(eq(callListEntries.contactId, logOnly))
    await db.insert(callLog).values({ accountId, contactId: logOnly, kind: 'quiet_a_while', period: '2026-06', outcome: 'dismissed' })

    const fresh = await homeowner(accountId, 'Fresh Face')
    await build(accountId, july)
    const next = await names(accountId, '2026-07')
    expect(next).not.toContain(shown)
    expect(next).not.toContain(logOnly)
    expect(next).toContain(fresh)
  })

  test('a paused account gets build_call_lists on send day, and no compose or send', async () => {
    const accountId = await account('paused', true)
    const person = await homeowner(accountId, 'Paused Person')
    const sendDay = new Date('2026-09-15T16:00:00.000Z')
    await scheduleAccountById(accountId, sendDay)
    const { db } = getRuntimeDb()
    const queued = await db
      .select({ kind: jobs.kind })
      .from(jobs)
      .where(sql`${jobs.payload}->>'accountId' = ${accountId}`)
    expect(queued.map((job) => job.kind)).toEqual(['build_call_lists'])
    expect(await db.select().from(sends).where(eq(sends.accountId, accountId))).toHaveLength(0)

    await build(accountId, sendDay)
    expect(await names(accountId, '2026-09')).toEqual([person])
  })

  test('the panel shows the record block the note renders, with no balance', async () => {
    const accountId = await account('panel')
    const cleo = await homeowner(accountId, 'Cleo Record')
    const { db } = getRuntimeDb()
    const [row] = await db.select({ parcelId: contacts.parcelId }).from(contacts).where(eq(contacts.id, cleo))
    const tag = cleo.slice(0, 8)
    await db.insert(parcelEvents).values([
      { parcelId: row!.parcelId!, county: 'Los Angeles', kind: GRANT_DEED, docNumber: `G-${tag}`, recordedAt: '2017-04-02', amount: 640_000, party: 'Cleo Record' },
      { parcelId: row!.parcelId!, county: 'Los Angeles', kind: DEED_OF_TRUST, docNumber: `T-${tag}`, recordedAt: '2017-04-02', amount: 512_000, party: 'Harbor Bank' },
    ])
    await build(accountId, june)
    const list = await loadCallList(accountId, june)
    if (list.kind !== 'list') throw new Error('expected a list')
    const panel = list.entries.find((entry) => entry.contactId === cleo)?.panel
    expect(panel?.record).toEqual(expect.arrayContaining([`Document G-${tag}`, 'Consideration $640,000']))
    expect(panel?.loan.join(' ')).toContain('The original loan on record is $512,000 from Harbor Bank')
    expect(JSON.stringify(panel)).not.toMatch(/balance|owe|remaining|payoff/i)
  })

  test('deleting a person removes their call log', async () => {
    const accountId = await account('delete')
    const gone = await homeowner(accountId, 'Gone Person')
    await build(accountId, june)
    await logCall(accountId, gone, 'called', june)
    // Other tables still block deleting a subscribed person (reported, out of scope here).
    await getRuntimeDb().db.delete(callListEntries).where(eq(callListEntries.contactId, gone))
    await getRuntimeDb().db.delete(contactSubscriptions).where(eq(contactSubscriptions.contactId, gone))
    expect(await deleteContactsForAccount(accountId, [gone])).toBe(1)
    const left = await getRuntimeDb().db.select().from(callLog).where(eq(callLog.contactId, gone))
    expect(left).toHaveLength(0)
  })
})
