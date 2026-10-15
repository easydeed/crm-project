import { eq, sql } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { hashPassword, verifyPassword } from '@/auth/password'
import { createDb } from '@/db/client'
import { demoCounts, seedDemo } from '@/db/demo-seed'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { accounts, parcelEvents } from '@/db/schema'

// Its own database on the scratch server, built from zero as the preview's is: the shared
// integration database holds other accounts, which the seeder rightly refuses.
const databaseUrl = tryLoadIntegrationDatabaseUrl()
const NAME = 'demo_seed_integration'
const PASSWORD = 'demo-integration-pw'

async function rows(db: ReturnType<typeof createDb>['db']) {
  const tables = ['accounts', 'parcels', 'contacts', 'parcel_events', 'contact_match_candidates']
  const out: Record<string, number> = {}
  for (const table of tables) {
    const [row] = await db.execute<{ n: number }>(sql.raw(`select count(*)::int as n from ${table}`))
    out[table] = row.n
  }
  return out
}

describe.skipIf(!databaseUrl)('the demo seeder (OR-050)', () => {
  let demo: ReturnType<typeof createDb>
  let admin: ReturnType<typeof createDb>

  beforeAll(async () => {
    admin = createDb(databaseUrl!)
    await admin.client.unsafe(`drop database if exists ${NAME}`)
    await admin.client.unsafe(`create database ${NAME}`)
    const url = new URL(databaseUrl!)
    url.pathname = `/${NAME}`
    demo = createDb(url.toString())
    demo.client.options.onnotice = () => {}
    await migrate(demo.db, { migrationsFolder: 'drizzle' })
  })

  afterAll(async () => {
    await demo?.client.end({ timeout: 5 })
    await admin?.client.unsafe(`drop database if exists ${NAME}`)
    await admin?.client.end({ timeout: 5 })
  })

  test('fills an empty database, and a rerun adds nothing', async () => {
    const now = new Date('2026-10-15T17:00:00Z')
    await seedDemo(demo.db, await hashPassword('first-password'), now)
    const first = await rows(demo.db)
    expect(first.accounts).toBe(1)
    expect(first.contacts).toBeGreaterThan(40)
    expect(first.contact_match_candidates).toBeGreaterThan(0)

    await seedDemo(demo.db, await hashPassword(PASSWORD), now)
    expect(await rows(demo.db)).toEqual(first)
    expect((await demoCounts(demo.db))?.contacts).toBe(first.contacts)
  })

  test('the rerun sets the password the demo signs in with', async () => {
    // The only account: the fixture agent.
    const [agent] = await demo.db.select({ hash: accounts.passwordHash }).from(accounts)
    expect(await verifyPassword(PASSWORD, agent!.hash)).toBe(true)
    expect(await verifyPassword('first-password', agent!.hash)).toBe(false)
  })

  test('a later rerun moves the live events to its own dates', async () => {
    await seedDemo(demo.db, await hashPassword(PASSWORD), new Date('2027-03-01T17:00:00Z'))
    const [event] = await demo.db.select({ at: parcelEvents.recordedAt }).from(parcelEvents).where(eq(parcelEvents.docNumber, 'E2E-LIVE-1852'))
    expect(event?.at).toBe('2027-02-24')
  })

  test('refuses a database with any other account, and writes nothing', async () => {
    await demo.db.insert(accounts).values({ email: 'someone@real.example', passwordHash: '!x', name: 'Someone Real', role: 'agent' })
    const before = await rows(demo.db)
    await expect(seedDemo(demo.db, await hashPassword(PASSWORD), new Date())).rejects.toThrow(/not the demo database/)
    expect(await rows(demo.db)).toEqual(before)
  })
})
