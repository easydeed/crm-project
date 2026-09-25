import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { loadHomeSend } from '@/app/app/home-send'
import { registerAccount } from '@/auth/register-account'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { withStreetNameNorm } from '@/db/parcel-write'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import { accounts, contactSubscriptions, contacts, parcelEvents, parcels, sendRecipients, sends, subscriptions } from '@/db/schema'
import { giveActiveSubscription } from '@/billing/subscription-fixture'
import { suppressions } from '@/db/schema-suppressions'
import { GRANT_DEED } from '@/digest/types'
import { importContacts } from '@/import/import-contacts'
import { composeSend } from '@/jobs/compose'
import { sendMail } from '@/jobs/send-job'
import { setMailer } from '@/mail/current'
import { FakeMailer } from '@/mail/fake-mailer'
import { PostmarkMailer } from '@/mail/postmark-mailer'
import { emailHash } from '@/suppression/hash'
import { suppress } from '@/suppression/suppressions'

const databaseUrl = tryLoadIntegrationDatabaseUrl()
const now = new Date('2026-09-10T18:00:00.000Z')

describe.skipIf(!databaseUrl)('OR-013a every contact is subscribed from the start', () => {
  const accountIds: string[] = []
  const parcelIds: string[] = []
  const hashes: string[] = []
  const mailer = new FakeMailer()

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
    setMailer(mailer)
    process.env.MAIL_FROM_MONTHLY = 'notes@example.com'
    delete process.env.SEND_ENABLED
    delete process.env.SEND_ALLOWLIST
  })

  afterAll(async () => {
    setMailer(new PostmarkMailer())
    delete process.env.MAIL_FROM_MONTHLY
    const { db, client } = getRuntimeDb()
    for (const accountId of accountIds) {
      const sendRows = await db.select({ id: sends.id }).from(sends).where(eq(sends.accountId, accountId))
      for (const send of sendRows) await db.delete(sendRecipients).where(eq(sendRecipients.sendId, send.id))
      await db.delete(sends).where(eq(sends.accountId, accountId))
      await db.delete(contacts).where(eq(contacts.accountId, accountId))
      await db.delete(subscriptions).where(eq(subscriptions.accountId, accountId))
      await db.delete(accounts).where(eq(accounts.id, accountId))
    }
    if (parcelIds.length) {
      await db.delete(parcelEvents).where(inArray(parcelEvents.parcelId, parcelIds))
      await db.delete(parcels).where(inArray(parcels.id, parcelIds))
    }
    if (hashes.length) await db.delete(suppressions).where(inArray(suppressions.emailHash, hashes))
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  /** An account with a send day, a street of matched houses, and a recent sale on it. */
  async function street(houses: number[]) {
    const created = await registerAccount({
      name: 'OR013a Agent',
      email: `or013a-${randomUUID()}@example.com`,
      password: 'long-enough-password',
      brokerage: 'Hill Realty',
      dre: '02001301',
      phone: '909-555-0131',
    })
    if (!created.ok) throw new Error('could not register')
    const accountId = created.accountId
    await giveActiveSubscription(accountId)
    accountIds.push(accountId)
    const { db } = getRuntimeDb()
    await db.update(accounts).set({ sendDay: 15, sendTime: '09:00', timezone: 'America/Los_Angeles' }).where(eq(accounts.id, accountId))
    const name = `Sub${accountId.slice(0, 6)} Ave`
    const zip = `9${Math.floor(1000 + Math.random() * 8999)}`
    const rows = [...houses, 1108].map((number) => {
      const id = randomUUID()
      parcelIds.push(id)
      return withStreetNameNorm({ id, apn: `OR013A-${id.slice(0, 8)}`, county: 'Los Angeles', address: `${number} ${name}`, city: 'La Verne', zip, beds: 3, baths: '2.0', sqft: 1680, useCode: 'SFR' })
    })
    await db.insert(parcels).values(rows)
    const sale = rows[rows.length - 1]!
    await db.insert(parcelEvents).values({ parcelId: sale.id!, county: 'Los Angeles', kind: GRANT_DEED, docNumber: `SB-${accountId.slice(0, 8)}`, recordedAt: '2026-08-20', amount: 1_000_000, party: 'Neighbor', raw: {} })
    return { accountId, name, zip }
  }

  function row(line: number, house: number, where: { name: string; zip: string }, email = `sub-${randomUUID().slice(0, 8)}@example.com`) {
    hashes.push(emailHash(email))
    return { line, name: `Person ${line}`, email, address: `${house} ${where.name}, La Verne, CA ${where.zip}`, closeDate: null }
  }

  async function monthlyRow(contactId: string) {
    const [sub] = await getRuntimeDb()
      .db.select()
      .from(contactSubscriptions)
      .where(and(eq(contactSubscriptions.contactId, contactId), eq(contactSubscriptions.scope, 'monthly')))
    return sub
  }

  test('import subscribes everyone it adds; the dashboard count is right immediately', async () => {
    const where = await street([1142, 1162])
    const { db } = getRuntimeDb()
    const summary = await importContacts(db, where.accountId, [row(2, 1142, where), row(3, 1162, where)])
    expect(summary.matched).toBe(2)
    const people = await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.accountId, where.accountId))
    for (const person of people) expect((await monthlyRow(person.id))?.unsubscribedAt).toBeNull()
    const home = await loadHomeSend(where.accountId, now)
    expect(home).toMatchObject({ kind: 'scheduled' })
    if (home.kind === 'scheduled') expect(home.sentence).toContain('to 2 homeowners.')
  })

  test('import of a suppressed address creates an unsubscribed row', async () => {
    const where = await street([1142])
    const { db } = getRuntimeDb()
    const email = `sub-stopped-${randomUUID().slice(0, 8)}@example.com`
    await suppress(db, email, 'unsubscribed', 'monthly', 'one_click')
    await importContacts(db, where.accountId, [row(2, 1142, where, email.toUpperCase())])
    const [person] = await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.accountId, where.accountId))
    expect((await monthlyRow(person!.id))?.unsubscribedAt).toBeInstanceOf(Date)
  })

  test('a contact cannot exist without a subscription row, however it is inserted', async () => {
    const where = await street([1142])
    const { db } = getRuntimeDb()
    const id = randomUUID()
    await db.execute(sql`insert into contacts (id, account_id, name, email, address_raw, status)
      values (${id}, ${where.accountId}, 'Raw Insert', ${`raw-${id.slice(0, 8)}@example.com`}, 'x', 'no_parcel')`)
    expect(await monthlyRow(id)).toMatchObject({ contactId: id, scope: 'monthly', unsubscribedAt: null })
  })

  test('the backfill gives every existing contact a row, active unless suppressed', async () => {
    const where = await street([1142, 1162])
    const { db } = getRuntimeDb()
    const stopped = `sub-back-${randomUUID().slice(0, 8)}@example.com`
    await importContacts(db, where.accountId, [row(2, 1142, where), row(3, 1162, where, stopped)])
    const people = await db.select({ id: contacts.id, email: contacts.email }).from(contacts).where(eq(contacts.accountId, where.accountId))
    // As things stood before migration 0006: no rows at all, and one address later suppressed.
    await db.delete(contactSubscriptions).where(inArray(contactSubscriptions.contactId, people.map((p) => p.id)))
    await suppress(db, stopped, 'complained', 'all', 'postmark_webhook')
    const backfill = readFileSync('drizzle/0006_subscribe_on_create.sql', 'utf8').split('--> statement-breakpoint').at(-1)!
    await db.execute(sql.raw(backfill))
    const [missing] = await db.execute<{ n: number }>(sql`select count(*)::int as n from contacts c
      where not exists (select 1 from contact_subscriptions cs where cs.contact_id = c.id and cs.scope = 'monthly')`)
    expect(missing?.n).toBe(0)
    for (const person of people) {
      const sub = await monthlyRow(person.id)
      if (person.email === stopped) expect(sub?.unsubscribedAt).toBeInstanceOf(Date)
      else expect(sub).toMatchObject({ unsubscribedAt: null })
    }
  })

  test('import → compose → send with default env composes and sends nothing', async () => {
    const where = await street([1142, 1162])
    const { db } = getRuntimeDb()
    await importContacts(db, where.accountId, [row(2, 1142, where), row(3, 1162, where)])
    const [send] = await db.insert(sends).values({ accountId: where.accountId, scheduledFor: now, state: 'scheduled' }).returning()
    await composeSend({ accountId: where.accountId, sendId: send!.id }, { jobId: 'or013a', attempt: 1, now })
    const composed = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, send!.id))
    expect(composed).toHaveLength(2)
    const before = mailer.calls.length
    await expect(sendMail({ sendId: send!.id }, { jobId: 'or013a', attempt: 1, now })).rejects.toThrow(/still unsent/)
    expect(mailer.calls.length).toBe(before)
    const after = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, send!.id))
    expect(after.every((r) => r.sentAt === null && /SEND_ENABLED/.test(r.error ?? ''))).toBe(true)
  })
})
