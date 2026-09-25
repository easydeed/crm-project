import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import { giveActiveSubscription } from '@/billing/subscription-fixture'
import type { CostRates } from '@/config/costs'
import { loadCostsForAdmin, monthWindow } from '@/db/admin-costs'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import { accounts, contacts, sendRecipients, sends, subscriptions } from '@/db/schema'
import { providerCalls } from '@/db/schema-billing'
import { recordProviderCall, withMetering } from '@/providers/metering'
import type { PropertyProvider } from '@/providers/types'

const databaseUrl = tryLoadIntegrationDatabaseUrl()
const RATES: CostRates = {
  effectiveDate: '2026-01-01',
  providerCallCents: { 'property:lookupParcel': 4 },
  sendCents: 0.5,
  fixedMonthlyCents: { email: 0, hosting: 0 },
}

class BillableProperty implements PropertyProvider {
  readonly billable = true
  async lookupParcel() {
    return null
  }
}

describe.skipIf(!databaseUrl)('OR-018 provider metering and /admin/costs against the database', () => {
  const accountIds: string[] = []

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
  })

  afterAll(async () => {
    const { db, client } = getRuntimeDb()
    await db.delete(providerCalls).where(inArray(providerCalls.accountId, accountIds))
    await db.delete(subscriptions).where(inArray(subscriptions.accountId, accountIds))
    await db.delete(accounts).where(inArray(accounts.id, accountIds))
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  async function account(label: string, role: 'agent' | 'admin' = 'agent') {
    const created = await registerAccount({
      name: `OR018 ${label}`, email: `or018-costs-${label}-${randomUUID()}@example.com`, password: 'long-enough-password',
      brokerage: 'Coastline Realty', dre: '01998432', phone: '909-555-0147',
    })
    if (!created.ok) throw new Error('register failed')
    accountIds.push(created.accountId)
    if (role === 'admin') await getRuntimeDb().db.update(accounts).set({ role }).where(eq(accounts.id, created.accountId))
    return created.accountId
  }

  async function sent(accountId: string, count: number, at: Date) {
    const { db } = getRuntimeDb()
    const [send] = await db.insert(sends).values({ accountId, scheduledFor: at, state: 'done' }).returning({ id: sends.id })
    for (let i = 0; i < count; i += 1) {
      const [person] = await db.insert(contacts).values({ accountId, name: `P${i}`, email: `p${i}-${randomUUID()}@example.com`, addressRaw: `${i} Elm St`, status: 'no_parcel' }).returning({ id: contacts.id })
      await db.insert(sendRecipients).values({ sendId: send!.id, contactId: person!.id, sentAt: at, subject: 's', html: 'h', plainText: 't' })
    }
  }

  test('provider_calls records a row per provider call, with its cost', async () => {
    const accountId = await account('metered')
    const record = (call: Parameters<typeof recordProviderCall>[0]) => recordProviderCall(call, RATES)
    const provider = withMetering(new BillableProperty(), 'property', { accountId, record })
    await provider.lookupParcel()
    await provider.lookupParcel()
    const rows = await getRuntimeDb().db.select().from(providerCalls).where(eq(providerCalls.accountId, accountId))
    expect(rows).toHaveLength(2)
    expect(rows.map((row) => [row.provider, row.operation, row.count, row.costCents])).toEqual([
      ['property', 'lookupParcel', 1, 4],
      ['property', 'lookupParcel', 1, 4],
    ])
    await recordProviderCall({ provider: 'property', operation: 'lookupParcel', accountId, count: 1 })
    const unpriced = await getRuntimeDb().db.select().from(providerCalls).where(eq(providerCalls.accountId, accountId))
    expect(unpriced.filter((row) => row.costCents === null)).toHaveLength(1)
  })

  test('/admin/costs computes margin from the seeded rows and only an admin can load it', async () => {
    const now = new Date()
    const { start } = monthWindow(now)
    const admin = await account('admin', 'admin')
    const paying = await account('paying')
    const lapsed = await account('lapsed')
    await giveActiveSubscription(paying)
    const record = (call: Parameters<typeof recordProviderCall>[0]) => recordProviderCall(call, RATES)
    const metered = withMetering(new BillableProperty(), 'property', { accountId: paying, record })
    for (let i = 0; i < 25; i += 1) await metered.lookupParcel()
    await sent(paying, 3, now)
    await sent(paying, 2, new Date(start.getTime() - 60_000)) // last month: not counted

    expect(await loadCostsForAdmin(paying, now, RATES)).toBeNull()
    const report = await loadCostsForAdmin(admin, now, RATES)
    const byId = Object.fromEntries(report!.rows.map((row) => [row.id, row]))
    expect(byId[admin]).toBeUndefined()
    // 25 lookups x 4 = 100, 3 sends x 0.5 = 1.5, fixed 0 -> COGS 101.5 against 1900
    expect(byId[paying]).toMatchObject({
      revenueCents: 1900, parcel: { count: 25, costCents: 100 }, sends: { count: 3, costCents: 1.5 },
      cogsCents: 101.5, marginCents: 1798.5, marginPct: 94.7,
    })
    expect(byId[lapsed]).toMatchObject({ revenueCents: 0, cogsCents: 0, marginCents: 0, marginPct: null })
    expect(report!.providerCallCount).toBeGreaterThanOrEqual(25)

    const quiet = await loadCostsForAdmin(admin, new Date('2031-03-15T12:00:00Z'), RATES)
    expect(quiet!.providerCallCount).toBe(0)
  })
})
