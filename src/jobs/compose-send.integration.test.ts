import { randomUUID } from 'node:crypto'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import { withStreetNameNorm } from '@/db/parcel-write'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { resetRuntimeDb, getRuntimeDb } from '@/db/runtime'
import {
  accounts,
  contactSubscriptions,
  contacts,
  jobs,
  mailEvents,
  parcelEvents,
  parcels,
  sendRecipients,
  sends,
} from '@/db/schema'
import { loadHomeSend } from '@/app/app/home-send'
import { composeSend } from '@/jobs/compose'
import { sendMail } from '@/jobs/send-job'
import { scheduleAccountById } from '@/jobs/schedule'
import { resumeUpcomingSend, skipUpcomingSend } from '@/jobs/send-controls'
import { GRANT_DEED } from '@/digest/types'
import { NOTHING_NEW_REASON } from '@/digest/skip-copy'
import { setMailer } from '@/mail/current'
import { FakeMailer } from '@/mail/fake-mailer'
import { PostmarkMailer } from '@/mail/postmark-mailer'
import { recordPostmarkEvent } from '@/mail/postmark-webhook'

const sessionUrl = tryLoadIntegrationDatabaseUrl()
const accountIds: string[] = []
const parcelIds: string[] = []
const sendIds: string[] = []
const AS_OF = new Date('2026-06-15T17:00:00.000Z')
const ctx = { jobId: 'or013', attempt: 1, now: AS_OF }

async function newAccount() {
  const created = await registerAccount({
    name: 'OR013 Agent',
    email: `or013-${randomUUID()}@example.com`,
    password: 'long-enough-password',
    brokerage: 'Coastline Realty',
    dre: '01998432',
    phone: '909-555-0147',
  })
  expect(created.ok).toBe(true)
  if (!created.ok) throw new Error('register failed')
  accountIds.push(created.accountId)
  const { db } = getRuntimeDb()
  await db
    .update(accounts)
    .set({
      senderName: 'Dana at Coastline',
      replyTo: 'dana@example.com',
      sendDay: 15,
      sendTime: '09:00',
      timezone: 'America/Los_Angeles',
    })
    .where(eq(accounts.id, created.accountId))
  return created.accountId
}

async function insertParcel(address: string, zip: string) {
  const { db } = getRuntimeDb()
  const id = randomUUID()
  await db.insert(parcels).values(
    withStreetNameNorm({
      id,
      apn: `OR013-${id.slice(0, 8)}`,
      county: 'Los Angeles',
      address,
      city: 'La Verne',
      zip,
      beds: 3,
      baths: '2.0',
      sqft: 1680,
      useCode: 'SFR',
    }),
  )
  parcelIds.push(id)
  return id
}

async function insertPerson(
  accountId: string,
  parcelId: string | null,
  email: string,
  status: 'matched' | 'needs_review' = 'matched',
) {
  const { db } = getRuntimeDb()
  const id = randomUUID()
  await db.insert(contacts).values({
    id,
    accountId,
    name: 'Marilyn Okafor',
    email,
    addressRaw: '1142 Oakdale Ave, La Verne, CA 91750',
    closeDate: '2019-03-14',
    status: parcelId ? status : 'no_parcel',
    parcelId,
  })
  if (status === 'matched' && parcelId) {
    await db.insert(contactSubscriptions).values({ contactId: id, scope: 'monthly' })
  }
  return id
}

async function newSend(accountId: string) {
  const { db } = getRuntimeDb()
  const [row] = await db
    .insert(sends)
    .values({
      accountId,
      scheduledFor: new Date('2026-06-15T16:00:00.000Z'),
      state: 'scheduled',
    })
    .returning()
  sendIds.push(row.id)
  return row.id
}

describe.skipIf(!sessionUrl)('compose and send', () => {
  const mailer = new FakeMailer()

  beforeAll(async () => {
    process.env.DATABASE_URL = sessionUrl!
    await resetRuntimeDb()
    setMailer(mailer)
    process.env.MAIL_FROM_MONTHLY = 'notes@example.com'
  })

  afterAll(async () => {
    setMailer(new PostmarkMailer())
    delete process.env.MAIL_FROM_MONTHLY
    delete process.env.SEND_ENABLED
    delete process.env.SEND_ALLOWLIST
    if (!sessionUrl) return
    const { db } = getRuntimeDb()
    if (sendIds.length) {
      await db.delete(sendRecipients).where(inArray(sendRecipients.sendId, sendIds))
      await db.delete(sends).where(inArray(sends.id, sendIds))
    }
    if (accountIds.length) {
      const people = await db
        .select({ id: contacts.id })
        .from(contacts)
        .where(inArray(contacts.accountId, accountIds))
      const ids = people.map((person) => person.id)
      if (ids.length) {
        await db.delete(contactSubscriptions).where(inArray(contactSubscriptions.contactId, ids))
        await db.delete(contacts).where(inArray(contacts.id, ids))
      }
      for (const accountId of accountIds) {
        await db.delete(jobs).where(sql`${jobs.payload}->>'accountId' = ${accountId}`)
      }
      await db.delete(accounts).where(inArray(accounts.id, accountIds))
    }
    for (const sendId of sendIds) {
      await db.delete(jobs).where(sql`${jobs.payload}->>'sendId' = ${sendId}`)
    }
    if (parcelIds.length) {
      await db.delete(parcelEvents).where(inArray(parcelEvents.parcelId, parcelIds))
      await db.delete(parcels).where(inArray(parcels.id, parcelIds))
    }
    await db.delete(mailEvents).where(sql`${mailEvents.email} like 'bounce-%@example.com'`)
    await resetRuntimeDb()
  })

  test('compose writes one row, skips quiet streets, and does not duplicate', async () => {
    const accountId = await newAccount()
    const zip = '91750'
    const street = `Oakmail ${accountId.slice(0, 8)} Ave`
    const home = await insertParcel(`1142 ${street}`, zip)
    const neighbor = await insertParcel(`1108 ${street}`, zip)
    const quiet = await insertParcel(`200 Quiet ${accountId.slice(0, 4)} Rd`, zip)
    const { db } = getRuntimeDb()
    await db.insert(parcelEvents).values([
      {
        parcelId: home,
        county: 'Los Angeles',
        kind: GRANT_DEED,
        docNumber: `GD-${accountId.slice(0, 8)}`,
        recordedAt: '2019-03-14',
        amount: 712000,
        party: 'Marilyn Okafor',
        raw: {},
      },
      {
        parcelId: neighbor,
        county: 'Los Angeles',
        kind: GRANT_DEED,
        docNumber: `NS-${accountId.slice(0, 8)}`,
        recordedAt: '2026-05-01',
        amount: 1120000,
        party: 'Neighbor',
        raw: {},
      },
    ])
    const sender = await insertPerson(accountId, home, `marilyn-${accountId.slice(0, 6)}@example.com`)
    const skipped = await insertPerson(accountId, quiet, `quiet-${accountId.slice(0, 6)}@example.com`)
    const sendId = await newSend(accountId)

    await composeSend({ accountId, sendId }, ctx)
    await composeSend({ accountId, sendId }, ctx)

    const rows = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, sendId))
    expect(rows).toHaveLength(1)
    expect(rows[0]?.contactId).toBe(sender)
    expect(rows[0]?.subject).toBe('What sold on your street.')
    expect(rows[0]?.html).toContain('Hi Marilyn')
    expect(rows[0]?.html).toContain('/u/')
    expect(rows[0]?.html).not.toContain('href="#unsubscribe"')
    expect(rows[0]?.plainText).toContain('Hi Marilyn')
    expect(rows[0]?.plainText).toContain('/u/')
    expect(rows.map((row) => row.contactId)).not.toContain(skipped)

    const [send] = await db.select().from(sends).where(eq(sends.id, sendId))
    expect(send?.state).toBe('ready')
    expect(send?.composedCount).toBe(1)
    expect(send?.skippedCount).toBe(1)
    expect(send?.skips).toEqual([{ contactId: skipped, reason: NOTHING_NEW_REASON }])
  })

  test('default env composes and sends nothing', async () => {
    delete process.env.SEND_ENABLED
    delete process.env.SEND_ALLOWLIST
    const before = mailer.calls.length
    const accountId = await newAccount()
    const zip = '91750'
    const street = `Gate ${accountId.slice(0, 8)} Ave`
    const home = await insertParcel(`1142 ${street}`, zip)
    const neighbor = await insertParcel(`1108 ${street}`, zip)
    const { db } = getRuntimeDb()
    await db.insert(parcelEvents).values({
      parcelId: neighbor,
      county: 'Los Angeles',
      kind: GRANT_DEED,
      docNumber: `GT-${accountId.slice(0, 8)}`,
      recordedAt: '2026-05-01',
      amount: 1000000,
      party: 'Neighbor',
      raw: {},
    })
    await insertPerson(accountId, home, `gate-${accountId.slice(0, 6)}@example.com`)
    const sendId = await newSend(accountId)
    await composeSend({ accountId, sendId }, ctx)
    await expect(sendMail({ sendId }, ctx)).rejects.toThrow(/still unsent/)
    expect(mailer.calls.length).toBe(before)
    const [row] = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, sendId))
    expect(row?.sentAt).toBeNull()
    expect(row?.error).toMatch(/SEND_ENABLED/)
  })

  test('send delivers once and a bad address does not stop the other', async () => {
    process.env.SEND_ENABLED = 'true'
    process.env.SEND_ALLOWLIST = 'example.com'
    mailer.failFor = (msg) => msg.to.startsWith('bad-')
    const accountId = await newAccount()
    const zip = '91750'
    const street = `Batch ${accountId.slice(0, 8)} Ave`
    const homeA = await insertParcel(`1142 ${street}`, zip)
    const homeB = await insertParcel(`1162 ${street}`, zip)
    const neighbor = await insertParcel(`1108 ${street}`, zip)
    const { db } = getRuntimeDb()
    await db.insert(parcelEvents).values({
      parcelId: neighbor,
      county: 'Los Angeles',
      kind: GRANT_DEED,
      docNumber: `BT-${accountId.slice(0, 8)}`,
      recordedAt: '2026-05-01',
      amount: 1000000,
      party: 'Neighbor',
      raw: {},
    })
    const good = `good-${accountId.slice(0, 6)}@example.com`
    const bad = `bad-${accountId.slice(0, 6)}@example.com`
    await insertPerson(accountId, homeA, good)
    await insertPerson(accountId, homeB, bad)
    const sendId = await newSend(accountId)
    await composeSend({ accountId, sendId }, ctx)
    const before = mailer.calls.length
    await expect(sendMail({ sendId }, ctx)).rejects.toThrow(/still unsent/)
    const rows = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, sendId))
    const sent = rows.find((row) => row.sentAt)
    const failed = rows.find((row) => !row.sentAt)
    expect(sent?.providerId).toMatch(/^fake-/)
    expect(failed?.error).toMatch(/Mailbox rejected/)
    expect(mailer.calls.filter((call) => call.to === good)).toHaveLength(1)
    const delivered = mailer.calls.find((call) => call.to === good)
    const names = delivered?.headers.map((header) => header.name)
    expect(names).toContain('List-Unsubscribe')
    expect(names).toContain('List-Unsubscribe-Post')
    expect(delivered?.headers.find((header) => header.name === 'List-Unsubscribe')?.value).toMatch(
      /<mailto:[^>]+>, <https?:\/\/[^>]+>/,
    )
    expect(
      delivered?.headers.find((header) => header.name === 'List-Unsubscribe-Post')?.value,
    ).toBe('List-Unsubscribe=One-Click')

    mailer.failFor = () => false
    await sendMail({ sendId }, ctx)
    expect(mailer.calls.filter((call) => call.to === good)).toHaveLength(1)
    expect(mailer.calls.filter((call) => call.to === bad)).toHaveLength(2)
    const after = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, sendId))
    expect(after.every((row) => row.sentAt)).toBe(true)
    await sendMail({ sendId }, ctx)
    expect(mailer.calls.length).toBe(before + 3)
  })

  test('a hard bounce unsubscribes and a later send skips that person', async () => {
    process.env.SEND_ENABLED = 'true'
    process.env.SEND_ALLOWLIST = 'example.com'
    mailer.failFor = () => false
    const accountId = await newAccount()
    const zip = '91750'
    const street = `Bounce ${accountId.slice(0, 8)} Ave`
    const home = await insertParcel(`1142 ${street}`, zip)
    const neighbor = await insertParcel(`1108 ${street}`, zip)
    const { db } = getRuntimeDb()
    await db.insert(parcelEvents).values({
      parcelId: neighbor,
      county: 'Los Angeles',
      kind: GRANT_DEED,
      docNumber: `BN-${accountId.slice(0, 8)}`,
      recordedAt: '2026-05-01',
      amount: 1000000,
      party: 'Neighbor',
      raw: {},
    })
    const email = `bounce-${accountId.slice(0, 6)}@example.com`
    const contactId = await insertPerson(accountId, home, email)
    const sendId = await newSend(accountId)
    await composeSend({ accountId, sendId }, ctx)
    const before = mailer.calls.length
    await recordPostmarkEvent({
      RecordType: 'Bounce',
      Type: 'HardBounce',
      TypeCode: 1,
      Email: email,
    })
    const [sub] = await db
      .select()
      .from(contactSubscriptions)
      .where(
        and(
          eq(contactSubscriptions.contactId, contactId),
          eq(contactSubscriptions.scope, 'monthly'),
        ),
      )
    expect(sub?.unsubscribedAt).toBeTruthy()
    await sendMail({ sendId }, ctx)
    expect(mailer.calls.length).toBe(before)
    const [row] = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, sendId))
    expect(row?.sentAt).toBeNull()
    expect(row?.permanentFailure).toBe(true)
    expect(row?.error).toMatch(/unsubscribed/)
  })

  test('skip and resume persist', async () => {
    const accountId = await newAccount()
    const now = new Date('2026-09-14T20:00:00.000Z')
    await skipUpcomingSend(accountId, now)
    const { db } = getRuntimeDb()
    const [skipped] = await db.select().from(sends).where(eq(sends.accountId, accountId))
    expect(skipped?.state).toBe('skipped')
    sendIds.push(skipped.id)
    await resumeUpcomingSend(accountId, now)
    const [resumed] = await db.select().from(sends).where(eq(sends.id, skipped.id))
    expect(resumed?.state).toBe('scheduled')
  })

  test('the home card names the next send date and the eligible count', async () => {
    const accountId = await newAccount()
    const street = `Card ${accountId.slice(0, 8)} Ave`
    const home = await insertParcel(`1142 ${street}`, '91750')
    const contactId = await insertPerson(accountId, home, `card-${accountId.slice(0, 6)}@example.com`)
    const view = await loadHomeSend(accountId, new Date('2026-09-14T20:00:00.000Z'))
    expect(view).toEqual({
      kind: 'scheduled',
      sentence: 'Your next email goes out September 15 to 1 homeowner.',
      previewContactId: contactId,
    })
  })

  test('scheduling the same account twice enqueues one compose job', async () => {
    const accountId = await newAccount()
    const now = new Date('2026-09-14T20:00:00.000Z')
    await scheduleAccountById(accountId, now)
    await scheduleAccountById(accountId, now)
    const { db } = getRuntimeDb()
    const queued = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.kind, 'compose'), sql`${jobs.payload}->>'accountId' = ${accountId}`))
    expect(queued).toHaveLength(1)
    const [send] = await db.select().from(sends).where(eq(sends.accountId, accountId))
    if (send) sendIds.push(send.id)
  })
})
