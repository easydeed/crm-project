import { randomUUID } from 'node:crypto'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { GET, POST } from '@/app/u/[token]/route'
import { registerAccount } from '@/auth/register-account'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { withStreetNameNorm } from '@/db/parcel-write'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import { accounts, contactSubscriptions, contacts, mailEvents, parcelEvents, parcels, sendRecipients, sends, subscriptions } from '@/db/schema'
import { giveActiveSubscription } from '@/billing/subscription-fixture'
import { suppressionLifts, suppressions } from '@/db/schema-suppressions'
import { GRANT_DEED } from '@/digest/types'
import { composeSend } from '@/jobs/compose'
import { sendMail } from '@/jobs/send-job'
import { setMailer } from '@/mail/current'
import { FakeMailer } from '@/mail/fake-mailer'
import { PostmarkMailer } from '@/mail/postmark-mailer'
import { recordPostmarkEvent } from '@/mail/postmark-webhook'
import { emailHash } from '@/suppression/hash'
import { signUnsubscribeToken } from '@/unsubscribe/token'

const databaseUrl = tryLoadIntegrationDatabaseUrl()
const ctx = { jobId: 'or014b', attempt: 1, now: new Date('2026-06-15T16:00:00.000Z') }
const BLOCKED = 'This address stopped accepting our email.'

describe.skipIf(!databaseUrl)('OR-014b keep them coming against the database', () => {
  const accountIds: string[] = []
  const parcelIds: string[] = []
  const emails: string[] = []
  const mailer = new FakeMailer()

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
    setMailer(mailer)
    process.env.MAIL_FROM_MONTHLY = 'notes@example.com'
  })

  afterAll(async () => {
    setMailer(new PostmarkMailer())
    delete process.env.MAIL_FROM_MONTHLY
    delete process.env.SEND_ENABLED
    delete process.env.SEND_ALLOWLIST
    const { db, client } = getRuntimeDb()
    for (const accountId of accountIds) {
      const sendRows = await db.select({ id: sends.id }).from(sends).where(eq(sends.accountId, accountId))
      for (const send of sendRows) await db.delete(sendRecipients).where(eq(sendRecipients.sendId, send.id))
      await db.delete(sends).where(eq(sends.accountId, accountId))
      const ids = (await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.accountId, accountId))).map((r) => r.id)
      if (ids.length) await db.delete(contactSubscriptions).where(inArray(contactSubscriptions.contactId, ids))
      await db.delete(contacts).where(eq(contacts.accountId, accountId))
      await db.delete(subscriptions).where(eq(subscriptions.accountId, accountId))
      await db.delete(accounts).where(eq(accounts.id, accountId))
    }
    if (parcelIds.length) {
      await db.delete(parcelEvents).where(inArray(parcelEvents.parcelId, parcelIds))
      await db.delete(parcels).where(inArray(parcels.id, parcelIds))
    }
    const hashes = emails.map(emailHash)
    if (hashes.length) {
      await db.delete(suppressions).where(inArray(suppressions.emailHash, hashes))
      await db.delete(suppressionLifts).where(inArray(suppressionLifts.emailHash, hashes))
      await db.delete(mailEvents).where(sql`lower(${mailEvents.email}) in (${sql.join(emails.map((e) => sql`${e}`), sql`, `)})`)
    }
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  /** A homeowner whose note will render: a matched house with a recent sale two doors down. */
  async function homeowner() {
    const created = await registerAccount({
      name: 'OR014b Agent',
      email: `or014b-${randomUUID()}@example.com`,
      password: 'long-enough-password',
      brokerage: 'Hill Realty',
      dre: '02001402',
      phone: '909-555-0142',
    })
    if (!created.ok) throw new Error('could not register')
    const accountId = created.accountId
    await giveActiveSubscription(accountId)
    accountIds.push(accountId)
    const { db } = getRuntimeDb()
    await db.update(accounts).set({ sendDay: 15, sendTime: '09:00', timezone: 'America/Los_Angeles' }).where(eq(accounts.id, accountId))
    const street = `Keep ${accountId.slice(0, 8)} Ave`
    const [home, neighbor] = [randomUUID(), randomUUID()]
    parcelIds.push(home, neighbor)
    const parcel = (id: string, number: number) =>
      withStreetNameNorm({ id, apn: `OR014B-${id.slice(0, 8)}`, county: 'Los Angeles', address: `${number} ${street}`, city: 'La Verne', zip: '91750', beds: 3, baths: '2.0', sqft: 1680, useCode: 'SFR' })
    await db.insert(parcels).values([parcel(home, 1142), parcel(neighbor, 1108)])
    await db.insert(parcelEvents).values({ parcelId: neighbor, county: 'Los Angeles', kind: GRANT_DEED, docNumber: `KP-${accountId.slice(0, 8)}`, recordedAt: '2026-05-01', amount: 1_000_000, party: 'Neighbor', raw: {} })
    const email = `keep-${randomUUID().slice(0, 8)}@example.com`
    emails.push(email)
    const contactId = randomUUID()
    await db.insert(contacts).values({ id: contactId, accountId, name: 'Marilyn Okafor', email, addressRaw: `1142 ${street}, La Verne, CA 91750`, closeDate: '2019-03-14', status: 'matched', parcelId: home })
    return { accountId, contactId, email, token: signUnsubscribeToken(contactId, 'monthly') }
  }

  const post = (token: string, body?: string) =>
    POST(
      new Request(`http://localhost:3000/u/${token}`, body ? { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body } : { method: 'POST' }),
      { params: Promise.resolve({ token }) },
    )
  const page = async (token: string) => (await GET(new Request(`http://localhost:3000/u/${token}`), { params: Promise.resolve({ token }) })).text()

  async function composeAndSend(accountId: string) {
    const { db } = getRuntimeDb()
    const [send] = await db.insert(sends).values({ accountId, scheduledFor: new Date(ctx.now.getTime() + Math.random() * 1e9), state: 'scheduled' }).returning()
    await composeSend({ accountId, sendId: send!.id }, ctx)
    await sendMail({ sendId: send!.id }, ctx)
  }

  async function stops(email: string) {
    return getRuntimeDb().db.select().from(suppressions).where(eq(suppressions.emailHash, emailHash(email)))
  }

  test('self-unsubscribe, then keep: logged, lifted, and the next note is delivered', async () => {
    process.env.SEND_ENABLED = 'true'
    process.env.SEND_ALLOWLIST = 'example.com'
    const { accountId, contactId, email, token } = await homeowner()
    await post(token)
    expect((await stops(email)).map((s) => s.source)).toEqual(['one_click'])
    await composeAndSend(accountId)
    expect(mailer.calls.filter((call) => call.to === email)).toHaveLength(0)

    expect(await page(token)).toContain('Actually, keep them coming')
    expect(await (await post(token, 'intent=keep')).text()).toContain('These emails will keep coming.')
    expect(await stops(email)).toHaveLength(0)
    const [sub] = await getRuntimeDb().db.select().from(contactSubscriptions).where(eq(contactSubscriptions.contactId, contactId))
    expect(sub?.unsubscribedAt).toBeNull()
    const lifts = await getRuntimeDb().db.select().from(suppressionLifts).where(eq(suppressionLifts.emailHash, emailHash(email)))
    expect(lifts).toHaveLength(1)
    expect(lifts[0]).toMatchObject({ reason: 'unsubscribed', scope: 'monthly', originalSource: 'one_click', source: 'keep_them_coming' })
    expect(JSON.stringify(lifts[0])).not.toContain(email)

    await composeAndSend(accountId)
    expect(mailer.calls.filter((call) => call.to === email)).toHaveLength(1)
  })

  test('a bounced address never shows keep, and a forged keep changes nothing', async () => {
    const { contactId, email, token } = await homeowner()
    await recordPostmarkEvent({ RecordType: 'Bounce', Type: 'HardBounce', Email: email })
    const html = await page(token)
    expect(html).not.toContain('Actually, keep them coming')
    expect(html).toContain(BLOCKED)
    expect(await (await post(token, 'intent=keep')).text()).toContain(BLOCKED)
    expect((await stops(email)).map((s) => s.reason)).toEqual(['bounced'])
    const [sub] = await getRuntimeDb().db.select().from(contactSubscriptions).where(eq(contactSubscriptions.contactId, contactId))
    expect(sub?.unsubscribedAt).toBeInstanceOf(Date)
    expect(await getRuntimeDb().db.select().from(suppressionLifts).where(eq(suppressionLifts.emailHash, emailHash(email)))).toHaveLength(0)
  })

  test('an unsubscribe plus a complaint is not reversible', async () => {
    const { contactId, email, token } = await homeowner()
    await post(token)
    await recordPostmarkEvent({ RecordType: 'SpamComplaint', Email: email })
    expect(await page(token)).not.toContain('Actually, keep them coming')
    expect(await (await post(token, 'intent=keep')).text()).not.toContain('These emails will keep coming.')
    expect((await stops(email)).map((s) => s.reason).sort()).toEqual(['complained', 'unsubscribed'])
    const [sub] = await getRuntimeDb()
      .db.select()
      .from(contactSubscriptions)
      .where(and(eq(contactSubscriptions.contactId, contactId), eq(contactSubscriptions.scope, 'monthly')))
    expect(sub?.unsubscribedAt).toBeInstanceOf(Date)
    expect(await getRuntimeDb().db.select().from(suppressionLifts).where(eq(suppressionLifts.emailHash, emailHash(email)))).toHaveLength(0)
  })
})
