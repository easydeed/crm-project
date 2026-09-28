import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { LENDER_KEY } from '@/addons/lender'
import { addonConfig, isAddonEnabled, switchAddonOff, switchAddonOn } from '@/addons/state'
import { registerAccount } from '@/auth/register-account'
import { withStreetNameNorm } from '@/db/parcel-write'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import { accounts, contacts, parcelEvents, parcels, sendRecipients, sends } from '@/db/schema'
import { GRANT_DEED } from '@/digest/types'
import { composeSend } from '@/jobs/compose'

const databaseUrl = tryLoadIntegrationDatabaseUrl()
const ctx = { jobId: 'or023', attempt: 1, now: new Date('2026-06-15T17:00:00.000Z') }
const MARCUS = { name: 'Marcus Tran', nmls: '448120', email: 'marcus@cardinal.test', company: 'Cardinal Home Loans' }

describe.skipIf(!databaseUrl)('OR-023 add my lender against the database', () => {
  const accountIds: string[] = []
  const parcelIds: string[] = []

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
  })
  afterAll(async () => {
    const { db, client } = getRuntimeDb()
    await db.delete(accounts).where(inArray(accounts.id, accountIds))
    await db.delete(parcelEvents).where(inArray(parcelEvents.parcelId, parcelIds))
    await db.delete(parcels).where(inArray(parcels.id, parcelIds))
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  async function agent() {
    const created = await registerAccount({
      name: 'OR023 Agent', email: `or023-${randomUUID()}@example.com`, password: 'long-enough-password',
      brokerage: 'Coastline Realty', dre: '01998432', phone: '909-555-0147',
    })
    if (!created.ok) throw new Error('register failed')
    accountIds.push(created.accountId)
    return created.accountId
  }

  /** One homeowner whose street had a sale, so compose writes a note. */
  async function homeownerWithNews(accountId: string) {
    const { db } = getRuntimeDb()
    const street = `Lender ${accountId.slice(0, 8)} Ave`
    const [home, neighbor] = [randomUUID(), randomUUID()]
    await db.insert(parcels).values([
      withStreetNameNorm({ id: home, apn: `OR023-H-${home.slice(0, 8)}`, county: 'Los Angeles', address: `1142 ${street}`, city: 'La Verne', zip: '91750', beds: 3, baths: '2.0', sqft: 1680, useCode: 'SFR' }),
      withStreetNameNorm({ id: neighbor, apn: `OR023-N-${neighbor.slice(0, 8)}`, county: 'Los Angeles', address: `1108 ${street}`, city: 'La Verne', zip: '91750', beds: 3, baths: '2.0', sqft: 1680, useCode: 'SFR' }),
    ])
    parcelIds.push(home, neighbor)
    await db.insert(parcelEvents).values([
      { parcelId: home, county: 'Los Angeles', kind: GRANT_DEED, docNumber: `GD-${home.slice(0, 8)}`, recordedAt: '2019-03-14', amount: 712000, party: 'Marilyn Okafor', raw: {} },
      { parcelId: neighbor, county: 'Los Angeles', kind: GRANT_DEED, docNumber: `NS-${neighbor.slice(0, 8)}`, recordedAt: '2026-05-01', amount: 1120000, party: 'Neighbor', raw: {} },
    ])
    await db.insert(contacts).values({ accountId, name: 'Marilyn Okafor', email: `marilyn-${home.slice(0, 8)}@example.com`, addressRaw: `1142 ${street}, La Verne, CA 91750`, closeDate: '2019-03-14', status: 'matched', parcelId: home })
  }

  async function composeFresh(accountId: string, scheduledFor: string) {
    const { db } = getRuntimeDb()
    const [send] = await db.insert(sends).values({ accountId, scheduledFor: new Date(scheduledFor), state: 'scheduled' }).returning({ id: sends.id })
    await composeSend({ accountId, sendId: send!.id }, ctx)
    const rows = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, send!.id))
    expect(rows).toHaveLength(1)
    return { sendId: send!.id, row: rows[0]! }
  }

  test('the add-on cannot switch on without a valid name, NMLS, and email; the NMLS error is inline', async () => {
    const id = await agent()
    const empty = await switchAddonOn(id, LENDER_KEY, {})
    expect(empty).toMatchObject({ ok: false, reason: 'config' })
    expect(Object.keys(empty.ok ? {} : empty.fieldErrors ?? {}).sort()).toEqual(['email', 'name', 'nmls'])
    const badNmls = await switchAddonOn(id, LENDER_KEY, { ...MARCUS, nmls: '44-812' })
    expect(badNmls).toMatchObject({ ok: false, fieldErrors: { nmls: 'NMLS is 6 to 8 digits, numbers only.' } })
    expect(await switchAddonOn(id, LENDER_KEY, { ...MARCUS, nmls: '123456789' })).toMatchObject({ ok: false, fieldErrors: { nmls: expect.any(String) } })
    expect(await switchAddonOn(id, LENDER_KEY, { ...MARCUS, email: 'marcus' })).toMatchObject({ ok: false, fieldErrors: { email: expect.any(String) } })
    expect(await isAddonEnabled(id, LENDER_KEY)).toBe(false)
    expect(await switchAddonOn(id, LENDER_KEY, { ...MARCUS, company: ' Guaranteed Rate ', phone: '' })).toEqual({ ok: true })
    expect(await addonConfig(id, LENDER_KEY)).toEqual({ ...MARCUS, company: 'Guaranteed Rate' })
  })

  test('the note carries the lender while the add-on is on; switching off drops it from the next compose and leaves composed rows alone', async () => {
    const id = await agent()
    await homeownerWithNews(id)
    const before = await composeFresh(id, '2026-05-15T16:00:00.000Z')
    expect(before.row.html).not.toContain('<!--block:lender-->')

    await switchAddonOn(id, LENDER_KEY, MARCUS)
    const on = await composeFresh(id, '2026-06-01T16:00:00.000Z')
    expect(on.row.html).toContain('<!--block:lender-->')
    expect(on.row.plainText).toContain('Marcus Tran · Cardinal Home Loans · NMLS 448120')

    await switchAddonOff(id, LENDER_KEY)
    expect(await addonConfig(id, LENDER_KEY)).toBeNull()
    await composeSend({ accountId: id, sendId: on.sendId }, ctx)
    const [unchanged] = await getRuntimeDb().db.select().from(sendRecipients).where(eq(sendRecipients.sendId, on.sendId))
    expect(unchanged!.html).toBe(on.row.html)
    const off = await composeFresh(id, '2026-06-15T16:00:00.000Z')
    expect(off.row.html).not.toContain('<!--block:lender-->')
    expect(off.row.plainText).not.toContain('NMLS')
  })
})
