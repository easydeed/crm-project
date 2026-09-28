import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'
import { providerCalls } from '@/db/schema-billing'
import { getListingProvider } from '@/providers/current'
import { CLOSED_LISTING_AGENTS } from '@/providers/fixtures/closed-listings'

const databaseUrl = tryLoadIntegrationDatabaseUrl()

describe.skipIf(!databaseUrl)('OR-024 closedByAgent is metered against the database', () => {
  let accountId = ''

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
    const created = await registerAccount({
      name: 'OR024 Agent', email: `or024-${randomUUID()}@example.com`, password: 'long-enough-password',
      brokerage: 'Coastline Realty', dre: '02002424', phone: '909-555-0124',
    })
    if (!created.ok) throw new Error('could not register the test account')
    accountId = created.accountId
  })

  afterAll(async () => {
    const { db, client } = getRuntimeDb()
    await db.delete(providerCalls).where(eq(providerCalls.accountId, accountId))
    await db.delete(accounts).where(eq(accounts.id, accountId))
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  test('every call writes one provider_calls row at zero cost, including an empty result', async () => {
    const provider = getListingProvider(accountId)
    expect(await provider.closedByAgent(CLOSED_LISTING_AGENTS.many)).toHaveLength(47)
    expect(await provider.closedByAgent(CLOSED_LISTING_AGENTS.none)).toEqual([])
    expect(await provider.closedByAgent(CLOSED_LISTING_AGENTS.unknown)).toEqual([])

    const rows = await getRuntimeDb().db.select().from(providerCalls).where(eq(providerCalls.accountId, accountId))
    expect(rows.map((row) => [row.provider, row.operation, row.count, row.costCents])).toEqual(
      Array(3).fill(['listing', 'closedByAgent', 1, 0]),
    )
  })
})
