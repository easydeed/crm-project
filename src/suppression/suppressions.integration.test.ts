import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { POST } from '@/app/u/[token]/route'
import { registerAccount } from '@/auth/register-account'
import { loadDeliverabilityForAdmin } from '@/db/admin-deliverability'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { withStreetNameNorm } from '@/db/parcel-write'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import { accounts, contactSubscriptions, contacts, mailEvents, parcels, sendRecipients, sends } from '@/db/schema'
import { suppressions } from '@/db/schema-suppressions'
import { importContacts } from '@/import/import-contacts'
import { composeSend } from '@/jobs/compose'
import { sendMail } from '@/jobs/send-job'
import { setMailer } from '@/mail/current'
import { FakeMailer } from '@/mail/fake-mailer'
import { PostmarkMailer } from '@/mail/postmark-mailer'
import { recordPostmarkEvent } from '@/mail/postmark-webhook'
import { EMAIL_HASH_SQL, emailHash } from '@/suppression/hash'
import { SUPPRESSED_REASON } from '@/suppression/suppressions'
import { signUnsubscribeToken } from '@/unsubscribe/token'

const databaseUrl = tryLoadIntegrationDatabaseUrl()
const ctx = { jobId: 'or014a', attempt: 1, now: new Date('2026-06-15T16:00:00.000Z') }

describe.skipIf(!databaseUrl)('OR-014a suppressions against the database', () => {
  const accountIds: string[] = []
  const hashes: string[] = []
  const emails: string[] = []
  const parcelIds: string[] = []
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
      await db.delete(accounts).where(eq(accounts.id, accountId))
    }
    if (parcelIds.length) await db.delete(parcels).where(inArray(parcels.id, parcelIds))
    if (emails.length) await db.delete(mailEvents).where(sql`lower(${mailEvents.email}) in (${sql.join(emails.map((e) => sql`${e}`), sql`, `)})`)
    if (hashes.length) await db.delete(suppressions).where(inArray(suppressions.emailHash, hashes))
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  async function account(role: 'agent' | 'admin' = 'agent') {
    const created = await registerAccount({
      name: 'OR014a Agent',
      email: `or014a-${randomUUID()}@example.com`,
      password: 'long-enough-password',
      brokerage: 'Hill Realty',
      dre: '02001401',
      phone: '909-555-0141',
    })
    if (!created.ok) throw new Error('could not register')
    accountIds.push(created.accountId)
    await getRuntimeDb().db.update(accounts).set({ role }).where(eq(accounts.id, created.accountId))
    return created.accountId
  }

  function address() {
    const email = `or014a-${randomUUID().slice(0, 8)}@example.com`
    hashes.push(emailHash(email))
    emails.push(email)
    return email
  }

  async function person(accountId: string, email: string) {
    const { db } = getRuntimeDb()
    const parcelId = randomUUID()
    parcelIds.push(parcelId)
    await db.insert(parcels).values(
      withStreetNameNorm({ id: parcelId, apn: `OR014A-${parcelId.slice(0, 8)}`, county: 'Los Angeles', address: `${Math.floor(Math.random() * 9000) + 100} Or014a St`, city: 'La Verne', zip: '91750' }),
    )
    const id = randomUUID()
    await db.insert(contacts).values({ id, accountId, name: 'Pat Doe', email, addressRaw: 'x', parcelId, status: 'matched' })
    return id
  }

  async function reasonsFor(email: string) {
    const rows = await getRuntimeDb().db.select().from(suppressions).where(eq(suppressions.emailHash, emailHash(email)))
    return rows.map((row) => `${row.reason}/${row.scope}/${row.source}`).sort()
  }

  test('the SQL hash and the app hash agree', async () => {
    const rows = await getRuntimeDb().db.execute<{ h: string }>(sql.raw(`select ${EMAIL_HASH_SQL(`'  Pat.Doe@Example.COM '`)} as h`))
    expect(rows[0]?.h).toBe(emailHash('pat.doe@example.com'))
  })

  test('the page, one-click, bounce, and complaint each write a suppression', async () => {
    const accountId = await account()
    const [page, oneClick, bounced, complained] = [address(), address(), address(), address()]
    const pageId = await person(accountId, page)
    const clickId = await person(accountId, oneClick)
    const post = (id: string, body?: string) => {
      const token = signUnsubscribeToken(id, 'monthly')
      const init: RequestInit = body
        ? { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body }
        : { method: 'POST' }
      return POST(new Request(`http://localhost:3000/u/${token}`, init), { params: Promise.resolve({ token }) })
    }
    await post(pageId, 'intent=stop')
    await post(clickId)
    await recordPostmarkEvent({ RecordType: 'Bounce', Type: 'HardBounce', Email: bounced })
    await recordPostmarkEvent({ RecordType: 'SpamComplaint', Email: complained.toUpperCase() })
    expect(await reasonsFor(page)).toEqual(['unsubscribed/monthly/unsubscribe_page'])
    expect(await reasonsFor(oneClick)).toEqual(['unsubscribed/monthly/one_click'])
    expect(await reasonsFor(bounced)).toEqual(['bounced/all/postmark_webhook'])
    expect(await reasonsFor(complained)).toEqual(['complained/all/postmark_webhook'])
    const [row] = await getRuntimeDb().db.select().from(suppressions).where(eq(suppressions.emailHash, emailHash(page)))
    expect(JSON.stringify(row)).not.toContain(page)
  })

  test('compose skips a suppressed address with the plain reason', async () => {
    const accountId = await account()
    const email = address()
    const id = await person(accountId, email)
    await recordPostmarkEvent({ RecordType: 'SpamComplaint', Email: email })
    await getRuntimeDb().db.update(contactSubscriptions).set({ unsubscribedAt: null }).where(eq(contactSubscriptions.contactId, id))
    const [send] = await getRuntimeDb().db.insert(sends).values({ accountId, scheduledFor: ctx.now, state: 'scheduled' }).returning()
    await composeSend({ accountId, sendId: send!.id }, ctx)
    const [after] = await getRuntimeDb().db.select().from(sends).where(eq(sends.id, send!.id))
    expect(after?.skips).toContainEqual({ contactId: id, reason: SUPPRESSED_REASON })
    expect(await getRuntimeDb().db.select().from(sendRecipients).where(eq(sendRecipients.sendId, send!.id))).toHaveLength(0)
  })

  test('delete then re-import: the person lands unsubscribed and is never sent to', async () => {
    process.env.SEND_ENABLED = 'true'
    process.env.SEND_ALLOWLIST = 'example.com'
    const accountId = await account()
    const email = address()
    const id = await person(accountId, email)
    const token = signUnsubscribeToken(id, 'monthly')
    await POST(new Request(`http://localhost:3000/u/${token}`, { method: 'POST' }), { params: Promise.resolve({ token }) })

    // Deleting a subscribed person is OR-006a; remove the row and its dependents directly.
    const { db } = getRuntimeDb()
    await db.delete(contactSubscriptions).where(eq(contactSubscriptions.contactId, id))
    await db.delete(contacts).where(eq(contacts.id, id))

    const summary = await importContacts(db, accountId, [
      { line: 2, name: 'Pat Doe', email: email.toUpperCase(), address: '1 Nowhere Rd, La Verne, CA 91750', closeDate: null },
    ])
    expect(summary.added).toBe(1)
    expect(summary.optedOut).toEqual([{ line: 2, name: 'Pat Doe', reason: SUPPRESSED_REASON }])
    const [back] = await db.select().from(contacts).where(and(eq(contacts.accountId, accountId), sql`lower(${contacts.email}) = ${email}`))
    const [sub] = await db.select().from(contactSubscriptions).where(and(eq(contactSubscriptions.contactId, back!.id), eq(contactSubscriptions.scope, 'monthly')))
    expect(sub?.unsubscribedAt).toBeInstanceOf(Date)

    // Worst case: something later turns their subscription back on and a recipient row exists.
    await db.update(contactSubscriptions).set({ unsubscribedAt: null }).where(eq(contactSubscriptions.contactId, back!.id))
    await db.update(contacts).set({ status: 'matched' }).where(eq(contacts.id, back!.id))
    const [send] = await db.insert(sends).values({ accountId, scheduledFor: ctx.now, state: 'ready' }).returning()
    await db.insert(sendRecipients).values({ sendId: send!.id, contactId: back!.id, html: '<p>x</p>', plainText: 'x', subject: 'x' })
    const before = mailer.calls.length
    await sendMail({ sendId: send!.id }, ctx)
    expect(mailer.calls.length).toBe(before)
    const [row] = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, send!.id))
    expect(row?.sentAt).toBeNull()
    expect(row?.error).toMatch(/suppressed/)
    expect(row?.permanentFailure).toBe(true)
  })

  test('the backfill covers every existing unsubscribed_at and keeps the real reason', async () => {
    const accountId = await account()
    const [plain, weekly, complained] = [address(), address(), address()]
    const { db } = getRuntimeDb()
    const a = await person(accountId, plain)
    const b = await person(accountId, weekly)
    const c = await person(accountId, complained)
    // Opt-outs recorded the pre-OR-014a way: only unsubscribed_at, no suppression yet.
    await db.update(contactSubscriptions).set({ unsubscribedAt: ctx.now }).where(inArray(contactSubscriptions.contactId, [a, c]))
    await db.insert(contactSubscriptions).values({ contactId: b, scope: 'weekly', unsubscribedAt: ctx.now })
    await db.insert(mailEvents).values({ kind: 'spam_complaint', email: complained, payload: {} })
    for (const statement of readFileSync('drizzle/0004_backfill_suppressions.sql', 'utf8').split('--> statement-breakpoint')) {
      await db.execute(sql.raw(statement))
    }
    expect(await reasonsFor(plain)).toEqual(['unsubscribed/monthly/backfill'])
    expect(await reasonsFor(weekly)).toEqual(['unsubscribed/weekly/backfill'])
    expect(await reasonsFor(complained)).toEqual(['complained/all/backfill'])
    const missing = await db.execute<{ n: number }>(sql.raw(`
      select count(*)::int as n from contact_subscriptions cs join contacts c on c.id = cs.contact_id
      where cs.unsubscribed_at is not null and not exists (
        select 1 from suppressions s where s.email_hash = ${EMAIL_HASH_SQL('c.email')}
          and (s.scope::text = cs.scope::text or s.scope = 'all'))`))
    expect(missing[0]?.n).toBe(0)
    await db.delete(mailEvents).where(eq(mailEvents.email, complained))
  })

  test('the admin list reads suppressions and shows an address only for a live contact', async () => {
    const adminId = await account('admin')
    const kept = address()
    const gone = address()
    await person(adminId, kept)
    await recordPostmarkEvent({ RecordType: 'Bounce', Type: 'HardBounce', Email: kept })
    await recordPostmarkEvent({ RecordType: 'Bounce', Type: 'HardBounce', Email: gone })
    const view = await loadDeliverabilityForAdmin(adminId)
    const rows = view!.suppressed
    expect(rows.find((row) => row.email === kept)?.reason).toBe('Hard bounce')
    expect(rows.some((row) => row.email === gone)).toBe(false)
    expect(rows.some((row) => row.email === null && row.reason === 'Hard bounce')).toBe(true)
  })
})
