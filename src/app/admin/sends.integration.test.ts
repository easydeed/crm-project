import { randomUUID } from 'node:crypto'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import { updateAccountSending } from '@/db/account-settings'
import { suppress } from '@/suppression/suppressions'
import { loadDeliverabilityForAdmin } from '@/db/admin-deliverability'
import { getSendForAdmin, listSendsForAdmin } from '@/db/admin-sends'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import {
  accounts,
  adminActions,
  contactSubscriptions,
  contacts,
  jobs,
  mailEvents,
  sendRecipients,
  sends,
} from '@/db/schema'
import { maybePauseForComplaints } from '@/jobs/complaint-pause'
import { adminUnpause, rerunSend } from '@/jobs/rerun-send'
import { sendMail } from '@/jobs/send-job'
import { unpauseAccount } from '@/jobs/send-controls'
import { setMailer } from '@/mail/current'
import { FakeMailer } from '@/mail/fake-mailer'
import { PostmarkMailer } from '@/mail/postmark-mailer'

const sessionUrl = tryLoadIntegrationDatabaseUrl()
const accountIds: string[] = []
const sendIds: string[] = []
const emails: string[] = []

async function newAccount(name: string, role: 'admin' | 'agent' = 'agent') {
  const created = await registerAccount({
    name,
    email: `or015-${randomUUID()}@example.com`,
    password: 'long-enough-password',
    brokerage: 'Coastline Realty',
    dre: '01998432',
    phone: '909-555-0147',
  })
  expect(created.ok).toBe(true)
  if (!created.ok) throw new Error('register failed')
  accountIds.push(created.accountId)
  if (role === 'admin') {
    const { db } = getRuntimeDb()
    await db.update(accounts).set({ role: 'admin' }).where(eq(accounts.id, created.accountId))
  }
  return created.accountId
}

async function deliver(accountId: string, count: number, complaints: number) {
  const { db } = getRuntimeDb()
  const [send] = await db
    .insert(sends)
    .values({
      accountId,
      scheduledFor: new Date(),
      state: 'done',
      composedCount: count,
    })
    .returning()
  sendIds.push(send.id)
  const people = Array.from({ length: count }, (_, index) => {
    const email = `box-${index}-${randomUUID().slice(0, 8)}@example.com`
    emails.push(email)
    return {
      id: randomUUID(),
      accountId,
      name: 'Pat Rivera',
      email,
      addressRaw: '1 Main St, La Verne, CA 91750',
      status: 'matched' as const,
    }
  })
  await db.insert(contacts).values(people)
  await db.insert(sendRecipients).values(
    people.map((person) => ({
      sendId: send.id,
      contactId: person.id,
      subject: 'Hi',
      html: '<p>Hi</p>',
      plainText: 'Hi',
      sentAt: new Date(),
    })),
  )
  if (complaints) {
    await db.insert(mailEvents).values(
      people.slice(0, complaints).map((person) => ({
        kind: 'spam_complaint',
        email: person.email,
        payload: { source: 'or015' },
      })),
    )
  }
  return people.map((person) => person.email)
}

describe.skipIf(!sessionUrl)('admin sends', () => {
  const mailer = new FakeMailer()

  beforeAll(async () => {
    process.env.DATABASE_URL = sessionUrl!
    await resetRuntimeDb()
    setMailer(mailer)
  })

  afterAll(async () => {
    setMailer(new PostmarkMailer())
    delete process.env.SEND_ENABLED
    delete process.env.SEND_ALLOWLIST
    delete process.env.MAIL_FROM_MONTHLY
    if (!sessionUrl) return
    const { db } = getRuntimeDb()
    if (sendIds.length) {
      for (const sendId of sendIds) {
        await db.delete(jobs).where(sql`${jobs.payload}->>'sendId' = ${sendId}`)
      }
      await db.delete(sendRecipients).where(inArray(sendRecipients.sendId, sendIds))
      await db.delete(sends).where(inArray(sends.id, sendIds))
    }
    if (accountIds.length) {
      await db.delete(adminActions).where(inArray(adminActions.targetAccountId, accountIds))
      const people = await db
        .select({ id: contacts.id })
        .from(contacts)
        .where(inArray(contacts.accountId, accountIds))
      const ids = people.map((person) => person.id)
      if (ids.length) {
        await db.delete(contactSubscriptions).where(inArray(contactSubscriptions.contactId, ids))
        await db.delete(contacts).where(inArray(contacts.id, ids))
      }
      await db.delete(accounts).where(inArray(accounts.id, accountIds))
    }
    if (emails.length) await db.delete(mailEvents).where(inArray(mailEvents.email, emails))
    await resetRuntimeDb()
  })

  test('an agent sees nothing, filters work, and stored html is not re-rendered', async () => {
    const admin = await newAccount('OR015 Admin', 'admin')
    const agent = await newAccount('OR015 Agent')
    expect(await listSendsForAdmin(agent, {})).toEqual([])
    const { db } = getRuntimeDb()
    const [ready] = await db
      .insert(sends)
      .values({
        accountId: agent,
        scheduledFor: new Date('2026-09-15T16:00:00.000Z'),
        state: 'ready',
        composedCount: 1,
        skippedCount: 2,
        skips: [
          { contactId: randomUUID(), reason: 'Nothing new on their street this month.' },
          { contactId: randomUUID(), reason: 'Nothing new on their street this month.' },
        ],
      })
      .returning()
    sendIds.push(ready.id)
    const other = await newAccount('OR015 Other')
    const [done] = await db
      .insert(sends)
      .values({
        accountId: other,
        scheduledFor: new Date('2026-08-15T16:00:00.000Z'),
        state: 'done',
        composedCount: 0,
      })
      .returning()
    sendIds.push(done.id)
    const contactId = randomUUID()
    const email = `stored-${contactId.slice(0, 8)}@example.com`
    emails.push(email)
    await db.insert(contacts).values({
      id: contactId,
      accountId: agent,
      name: 'Marilyn Okafor',
      email,
      addressRaw: '1142 Oakdale Ave',
      status: 'matched',
    })
    const stored = '<!--block:taxes-->EXACT-STORED-BYTES'
    await db.insert(sendRecipients).values([
      {
        sendId: ready.id,
        contactId,
        subject: 'What sold on your street.',
        html: stored,
        plainText: 'stored',
        sentAt: new Date(),
      },
    ])
    await db.insert(mailEvents).values({ kind: 'hard_bounce', email, payload: { source: 'or015' } })
    const failedId = randomUUID()
    const failedEmail = `fail-${failedId.slice(0, 8)}@example.com`
    emails.push(failedEmail)
    await db.insert(contacts).values({
      id: failedId,
      accountId: agent,
      name: 'Failed Person',
      email: failedEmail,
      addressRaw: '2 Main St',
      status: 'matched',
    })
    await db.insert(sendRecipients).values({
      sendId: ready.id,
      contactId: failedId,
      subject: 'Hi',
      html: '<p>no</p>',
      error: 'Mailbox rejected',
      permanentFailure: true,
    })
    await db.insert(jobs).values({
      kind: 'send',
      payload: { sendId: ready.id },
      payloadKey: `or015-${ready.id}`,
      runAfter: new Date(),
      attempts: 2,
    })

    const listed = await listSendsForAdmin(admin, {})
    const row = listed.find((item) => item.id === ready.id)
    expect(row).toMatchObject({
      accountName: 'OR015 Agent',
      state: 'ready',
      composed: 1,
      skipped: 2,
      sent: 1,
      failed: 1,
      bounced: 1,
    })
    expect(await listSendsForAdmin(admin, { accountId: other })).toEqual([
      expect.objectContaining({ id: done.id, state: 'done' }),
    ])
    expect(await listSendsForAdmin(admin, { state: 'ready' })).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: ready.id })]),
    )
    expect(
      (await listSendsForAdmin(admin, { state: 'ready' })).every((item) => item.state === 'ready'),
    ).toBe(true)

    const detail = await getSendForAdmin(admin, ready.id)
    expect(detail?.composed.find((item) => item.email === email)?.html).toBe(stored)
    expect(detail?.composed.find((item) => item.email === email)?.blocks).toEqual(['taxes'])
    expect(detail?.skipped).toEqual([
      { reason: 'Nothing new on their street this month.', count: 2 },
    ])
    expect(detail?.failedRows).toEqual([
      expect.objectContaining({
        email: failedEmail,
        error: 'Mailbox rejected',
        attempts: 2,
        permanent: true,
      }),
    ])
  })

  test('re-run enqueues, skips rows already sent, and writes an audit row', async () => {
    process.env.SEND_ENABLED = 'true'
    process.env.SEND_ALLOWLIST = 'example.com'
    process.env.MAIL_FROM_MONTHLY = 'notes@example.com'
    const admin = await newAccount('OR015 Rerun Admin', 'admin')
    const agent = await newAccount('OR015 Rerun Agent')
    const { db } = getRuntimeDb()
    const [send] = await db
      .insert(sends)
      .values({ accountId: agent, scheduledFor: new Date(), state: 'done', composedCount: 2 })
      .returning()
    sendIds.push(send.id)
    const sentEmail = `sent-${randomUUID().slice(0, 8)}@example.com`
    const waitEmail = `wait-${randomUUID().slice(0, 8)}@example.com`
    emails.push(sentEmail, waitEmail)
    const sentId = randomUUID()
    const waitId = randomUUID()
    await db.insert(contacts).values([
      {
        id: sentId,
        accountId: agent,
        name: 'Sent',
        email: sentEmail,
        addressRaw: '3 Main',
        status: 'matched',
      },
      {
        id: waitId,
        accountId: agent,
        name: 'Waiting',
        email: waitEmail,
        addressRaw: '4 Main',
        status: 'matched',
      },
    ])
    await db.insert(sendRecipients).values([
      {
        sendId: send.id,
        contactId: sentId,
        subject: 'Hi',
        html: '<p>sent</p>',
        plainText: 'sent',
        sentAt: new Date(),
      },
      {
        sendId: send.id,
        contactId: waitId,
        subject: 'Hi',
        html: '<p>wait</p>',
        plainText: 'wait',
      },
    ])
    const before = mailer.calls.length
    const queued = await rerunSend(admin, send.id)
    expect(queued.ok).toBe(true)
    const [job] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.kind, 'send'), sql`${jobs.payload}->>'sendId' = ${send.id}`))
    expect(job?.payload).toMatchObject({ sendId: send.id })
    await sendMail({ sendId: send.id }, { jobId: 'or015', attempt: 1, now: new Date() })
    const called = mailer.calls.slice(before).map((call) => call.to)
    expect(called).toEqual([waitEmail])
    const [audit] = await db
      .select()
      .from(adminActions)
      .where(and(eq(adminActions.targetAccountId, agent), eq(adminActions.action, 'rerun_send')))
    expect(audit?.adminAccountId).toBe(admin)
    expect(audit?.detail).toMatchObject({ sendId: send.id })
  })

  test('complaint rate pauses only past the line, and the agent cannot undo it', async () => {
    const admin = await newAccount('OR015 Pause Admin', 'admin')
    const under = await newAccount('OR015 Under')
    const few = await newAccount('OR015 Few')
    const over = await newAccount('OR015 Over')
    await deliver(under, 50, 0)
    await deliver(few, 49, 1)
    await deliver(over, 50, 1)
    expect(await maybePauseForComplaints(under)).toBe(false)
    expect(await maybePauseForComplaints(few)).toBe(false)
    expect(await maybePauseForComplaints(over)).toBe(true)
    const { db } = getRuntimeDb()
    const [paused] = await db.select().from(accounts).where(eq(accounts.id, over))
    expect(paused?.paused).toBe(true)
    const [audit] = await db
      .select()
      .from(adminActions)
      .where(eq(adminActions.targetAccountId, over))
    expect(audit?.action).toBe('complaint_pause')
    expect(audit?.adminAccountId).toBeNull()
    expect(audit?.detail).toMatchObject({ actor: 'system' })

    await unpauseAccount(over)
    const [still] = await db.select().from(accounts).where(eq(accounts.id, over))
    expect(still?.paused).toBe(true)
    await updateAccountSending(over, {
      sendDay: 15,
      sendTime: '09:00',
      timezone: 'America/Los_Angeles',
      paused: false,
    })
    const [stillSaved] = await db.select().from(accounts).where(eq(accounts.id, over))
    expect(stillSaved?.paused).toBe(true)

    expect((await adminUnpause(admin, over)).ok).toBe(true)
    const [open] = await db.select().from(accounts).where(eq(accounts.id, over))
    expect(open?.paused).toBe(false)
  })

  test('deliverability counts the trailing window by domain', async () => {
    const admin = await newAccount('OR015 Rates Admin', 'admin')
    const agent = await newAccount('OR015 Rates Agent')
    const now = new Date()
    const before = await loadDeliverabilityForAdmin(admin, now)
    const gmail = `g-${randomUUID().slice(0, 8)}@gmail.com`
    const yahoo = `y-${randomUUID().slice(0, 8)}@yahoo.com`
    const outlook = `o-${randomUUID().slice(0, 8)}@outlook.com`
    emails.push(gmail, yahoo, outlook)
    const { db } = getRuntimeDb()
    const people = [gmail, yahoo, outlook].map((email) => ({
      id: randomUUID(),
      accountId: agent,
      name: 'Pat',
      email,
      addressRaw: '9 Main',
      status: 'matched' as const,
    }))
    await db.insert(contacts).values(people)
    const [send] = await db
      .insert(sends)
      .values({ accountId: agent, scheduledFor: now, state: 'done', composedCount: 3 })
      .returning()
    sendIds.push(send.id)
    await db.insert(sendRecipients).values(
      people.map((person) => ({
        sendId: send.id,
        contactId: person.id,
        subject: 'Hi',
        html: '<p>Hi</p>',
        plainText: 'Hi',
        sentAt: now,
      })),
    )
    await db.insert(mailEvents).values([
      { kind: 'hard_bounce', email: gmail, payload: { source: 'or015' } },
      { kind: 'spam_complaint', email: yahoo, payload: { source: 'or015' } },
    ])
    await db
      .update(contactSubscriptions)
      .set({ unsubscribedAt: now })
      .where(eq(contactSubscriptions.contactId, people[2].id))
    // The write paths (webhook, unsubscribe page) record these; the list reads only suppressions.
    await suppress(db, gmail, 'bounced', 'all', 'postmark_webhook', now)
    await suppress(db, yahoo, 'complained', 'all', 'postmark_webhook', now)
    await suppress(db, outlook, 'unsubscribed', 'monthly', 'unsubscribe_page', now)
    const after = await loadDeliverabilityForAdmin(admin, now)
    expect(after?.totals.sent).toBe((before?.totals.sent ?? 0) + 3)
    expect(after?.totals.bounced).toBe((before?.totals.bounced ?? 0) + 1)
    expect(after?.totals.complained).toBe((before?.totals.complained ?? 0) + 1)
    expect(after?.totals.unsubscribed).toBe((before?.totals.unsubscribed ?? 0) + 1)
    const gmailRow = after?.totals.domains.find((row) => row.domain === 'gmail.com')
    const yahooRow = after?.totals.domains.find((row) => row.domain === 'yahoo.com')
    expect(gmailRow?.bounced).toBeGreaterThanOrEqual(1)
    expect(yahooRow?.complained).toBeGreaterThanOrEqual(1)
    expect(after?.suppressed.find((row) => row.email === gmail)?.reason).toBe('Hard bounce')
    expect(after?.suppressed.find((row) => row.email === yahoo)?.reason).toBe('Spam complaint')
    expect(after?.suppressed.find((row) => row.email === outlook)?.reason).toBe('Unsubscribed')
  })
})
