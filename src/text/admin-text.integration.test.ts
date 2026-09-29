import { randomUUID } from 'node:crypto'
import { inArray } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'
import { textMessages } from '@/db/schema-text'
import { loadPeriodText } from '@/text/admin-text'

const databaseUrl = tryLoadIntegrationDatabaseUrl()

describe.skipIf(!databaseUrl)('OR-026 admin sees this period’s call-list text', () => {
  const ids: string[] = []

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
  })

  afterAll(async () => {
    const { db, client } = getRuntimeDb()
    await db.delete(accounts).where(inArray(accounts.id, ids))
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  test('the row for the current period, with its error; last month’s row is not shown', async () => {
    const created = await registerAccount({ name: 'OR026 Texter', email: `or026-text-${randomUUID()}@example.com`, password: 'long-enough-password', brokerage: '', dre: '', phone: '909-555-0126' })
    if (!created.ok) throw new Error('could not register')
    ids.push(created.accountId)
    const now = new Date('2026-10-15T17:00:00Z')
    const { db } = getRuntimeDb()
    await db.insert(textMessages).values([
      { accountId: created.accountId, kind: 'call_list', period: '2026-09', toPhone: '+19095550126', providerId: 'SM-old' },
      { accountId: created.accountId, kind: 'call_list', period: '2026-10', toPhone: '+19095550126', error: 'Text blocked: TEXTING_ENABLED is not true' },
    ])

    const { period, row } = await loadPeriodText(created.accountId, now)
    expect(period).toBe('2026-10')
    expect(row).toMatchObject({ providerId: null, error: 'Text blocked: TEXTING_ENABLED is not true', permanentFailure: false })
  })

  test('an account with no text this period shows none', async () => {
    const created = await registerAccount({ name: 'OR026 Quiet', email: `or026-quiet-${randomUUID()}@example.com`, password: 'long-enough-password', brokerage: '', dre: '', phone: '' })
    if (!created.ok) throw new Error('could not register')
    ids.push(created.accountId)
    expect(await loadPeriodText(created.accountId, new Date('2026-10-15T17:00:00Z'))).toEqual({ period: '2026-10', row: null })
  })
})
