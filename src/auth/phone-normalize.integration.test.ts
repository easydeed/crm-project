import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { registerAccount, signupPhone } from '@/auth/register-account'
import { parseOptionalUsPhone } from '@/config/phone'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'

const databaseUrl = tryLoadIntegrationDatabaseUrl()

/** Phones as agents actually type them, plus the ones signup must keep rather than refuse. */
const TYPED = [
  '909-555-0161', '(909) 555-0161', '909.555.0161', '+1 909 555 0161', '1-909-555-0161', '9095550161',
  ' 909 555 0161 ', 'call my office', '555-0161', '+44 20 7946 0958', '909-555-0161 x12',
]

describe.skipIf(!databaseUrl)('OR-026 account phones are stored as 10 digits', () => {
  const ids: string[] = []

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
  })

  afterAll(async () => {
    const { db, client } = getRuntimeDb()
    if (ids.length) await db.delete(accounts).where(inArray(accounts.id, ids))
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  test('signup stores what Settings would store, and keeps anything else as typed instead of refusing it', async () => {
    for (const phone of TYPED) {
      const created = await registerAccount({
        name: 'OR026 Phone', email: `or026-phone-${randomUUID()}@example.com`, password: 'long-enough-password',
        brokerage: '', dre: '', phone,
      })
      expect(created.ok, phone).toBe(true)
      if (!created.ok) continue
      ids.push(created.accountId)
      const [row] = await getRuntimeDb().db.select({ phone: accounts.phone }).from(accounts).where(eq(accounts.id, created.accountId))
      const settings = parseOptionalUsPhone(phone)
      // Wherever Settings accepts the number, signup stores exactly what Settings stores.
      if (settings.ok) expect(row?.phone, phone).toBe(settings.phone)
      else expect(row?.phone, phone).toBe(phone.trim())
    }
    expect(signupPhone('   ')).toBeNull()
  })

  test('the backfill migration rewrites old rows exactly as the code would, and leaves the rest as typed', async () => {
    const { db } = getRuntimeDb()
    const rows = TYPED.map((phone) => ({
      id: randomUUID(), email: `or026-backfill-${randomUUID()}@example.com`, passwordHash: 'x', name: 'OR026 Backfill', phone, role: 'agent' as const,
    }))
    await db.insert(accounts).values(rows)
    ids.push(...rows.map((row) => row.id))

    const migration = readFileSync(new URL('../../drizzle/0014_account_phone_backfill.sql', import.meta.url), 'utf8')
    for (const statement of migration.split('--> statement-breakpoint')) await db.execute(sql.raw(statement))

    const after = await db.select({ id: accounts.id, phone: accounts.phone }).from(accounts).where(inArray(accounts.id, rows.map((row) => row.id)))
    const byId = new Map(after.map((row) => [row.id, row.phone]))
    for (const row of rows) expect(byId.get(row.id), row.phone).toBe(signupPhone(row.phone))
  })
})
