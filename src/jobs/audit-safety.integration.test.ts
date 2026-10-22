import { randomUUID } from 'node:crypto'
import * as digestBuilder from '@/digest/build-input'
import { createDb } from '@/db/client'
import { withTransactionDb } from '@/db/runtime'
import { recomposeUnsentSend } from '@/jobs/recompose-send'
import { eq, sql } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb } from '@/db/runtime'
import { contactsTable } from '@/db/live-contacts'
import { accounts, contactSubscriptions, jobs, mailEvents, sendRecipients, sends } from '@/db/schema'
import { composeSend } from '@/jobs/compose'
import { sendMail } from '@/jobs/send-job'
import { enqueue } from '@/jobs/enqueue'
import { claimNextJob } from '@/jobs/run'
import { scheduleAccountById } from '@/jobs/schedule'
import { setMailer } from '@/mail/current'
import { FakeMailer } from '@/mail/fake-mailer'
import { PostmarkMailer } from '@/mail/postmark-mailer'
import { auditFixtures, AUDIT_CONTEXT as ctx, AUDIT_NOW } from '@/test/audit-fixtures'

describe.skipIf(!tryLoadIntegrationDatabaseUrl())('OR-055 adversarial delivery review', () => {
  const fixtures = auditFixtures()
  const env = { ...process.env }
  let mailer: FakeMailer
  beforeEach(() => {
    process.env.SEND_ENABLED = 'true'
    process.env.SEND_ALLOWLIST = 'example.com'
    process.env.MAIL_FROM_MONTHLY = 'notes@example.com'
    mailer = new FakeMailer()
    setMailer(mailer)
  })
  afterAll(async () => { vi.restoreAllMocks(); await fixtures.cleanup(); setMailer(new PostmarkMailer()); process.env = env })

  test('composition rolls back the entire batch after a mid-batch failure', async () => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await db.insert(contactsTable).values({ ...home.contact, id: randomUUID(), email: `second-${home.accountId}@example.com` })
    const original = digestBuilder.buildDigestInput
    let calls = 0
    const spy = vi.spyOn(digestBuilder, 'buildDigestInput').mockImplementation(async (...args) => {
      if (++calls === 2) throw new Error('Interrupted composition')
      return original(...args)
    })
    try {
      await expect(composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)).rejects.toThrow('Interrupted composition')
      expect(await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId))).toHaveLength(0)
      expect((await db.select().from(sends).where(eq(sends.id, home.sendId)))[0].state).toBe('scheduled')
    } finally { spy.mockRestore() }
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    expect(await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId))).toHaveLength(2)
  })

  test('composers on separate database connections expose just one complete batch', async () => {
    const home = await fixtures.household()
    const other = createDb(process.env.DATABASE_URL!)
    const spy = vi.spyOn(digestBuilder, 'buildDigestInput')
    try {
      await Promise.all([
        composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx),
        withTransactionDb(other.db, () => composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)),
      ])
      expect(spy).toHaveBeenCalledTimes(1)
    } finally { spy.mockRestore(); await other.client.end({ timeout: 2 }) }
  })

  test('support can recompose stale unsent content but cannot release an uncertain claim', async () => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    expect(await recomposeUnsentSend(home.accountId, home.sendId)).toBe(false)
    await db.update(accounts).set({ role: 'admin' }).where(eq(accounts.id, home.accountId))
    await db.update(contactsTable).set({ name: 'Updated homeowner' }).where(eq(contactsTable.id, home.contact.id))
    await sendMail({ sendId: home.sendId }, ctx)
    // OR-056: this recovery fixture must be an unfinished batch. Finished sends
    // are now refused, separately proven in review-fixes.integration.test.ts.
    await db.update(sends).set({ state: 'ready' }).where(eq(sends.id, home.sendId))
    expect(await recomposeUnsentSend(home.accountId, home.sendId)).toBe(true)
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    const [row] = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId))
    expect(row.html).toContain('Hi Updated')
    await db.update(sendRecipients).set({ deliveryClaimedAt: ctx.now, permanentFailure: true, error: 'Delivery outcome unknown.' }).where(eq(sendRecipients.id, row.id))
    await recomposeUnsentSend(home.accountId, home.sendId)
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    expect((await db.select().from(sendRecipients).where(eq(sendRecipients.id, row.id)))[0].deliveryClaimedAt).not.toBeNull()
    await sendMail({ sendId: home.sendId }, ctx)
    expect(mailer.calls).toHaveLength(0)
  })

  test('a send before compose refuses and remains scheduled', async () => {
    const home = await fixtures.household()
    await expect(sendMail({ sendId: home.sendId }, ctx)).rejects.toThrow(/waiting for composition/)
    const [send] = await getRuntimeDb().db.select().from(sends).where(eq(sends.id, home.sendId))
    expect(send.state).toBe('scheduled')
    expect(mailer.calls).toHaveLength(0)
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    await sendMail({ sendId: home.sendId }, ctx)
    expect(mailer.calls).toHaveLength(1)
  })

  test.each([
    { email: 'different@example.com' }, { name: 'Different Person' },
    { addressRaw: 'Elsewhere' }, { closeDate: '2020-01-01' },
    { status: 'needs_review' as const }, { parcelId: null },
  ])('an edit after compose never sends stale personalized content: %j', async (change) => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    await db.update(contactsTable).set(change).where(eq(contactsTable.id, home.contact.id))
    await sendMail({ sendId: home.sendId }, ctx)
    expect(mailer.calls).toHaveLength(0)
    const [row] = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId))
    expect(row).toMatchObject({ sentAt: null, permanentFailure: true, error: expect.stringContaining('changed after composition') })
  })

  test('two workers competing for the same recipient make only one provider call', async () => {
    const home = await fixtures.household()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    await Promise.allSettled([sendMail({ sendId: home.sendId }, ctx), sendMail({ sendId: home.sendId }, ctx)])
    expect(mailer.calls).toHaveLength(1)
  })

  test('a provider refusal can retry, but an uncertain outcome cannot', async () => {
    const home = await fixtures.household()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    mailer.failFor = () => true
    await expect(sendMail({ sendId: home.sendId }, ctx)).rejects.toThrow(/still unsent/)
    mailer.failFor = () => false
    await sendMail({ sendId: home.sendId }, ctx)
    expect(mailer.calls).toHaveLength(2)
    const uncertain = await fixtures.household()
    await composeSend({ accountId: uncertain.accountId, sendId: uncertain.sendId }, ctx)
    const send = vi.spyOn(mailer, 'send').mockRejectedValue(new Error('Connection lost after accepting request'))
    await sendMail({ sendId: uncertain.sendId }, ctx)
    await sendMail({ sendId: uncertain.sendId }, ctx)
    expect(send).toHaveBeenCalledTimes(1)
    send.mockRestore()
    const [row] = await getRuntimeDb().db.select().from(sendRecipients).where(eq(sendRecipients.sendId, uncertain.sendId))
    expect(row).toMatchObject({ permanentFailure: true, sentAt: null, error: expect.stringContaining('outcome unknown') })
    expect(row.deliveryClaimedAt).not.toBeNull()
  })

  test('a persisted claim survives worker loss and is never automatically redelivered', async () => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    await db.update(sendRecipients).set({ deliveryClaimedAt: new Date(AUDIT_NOW.getTime() - 16 * 60_000) }).where(eq(sendRecipients.sendId, home.sendId))
    await sendMail({ sendId: home.sendId }, ctx)
    expect(mailer.calls).toHaveLength(0)
    const [row] = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId))
    expect(row.error).toContain('outcome unknown')
  })

  test('a missing subscription is a refusal, not implied consent', async () => {
    const home = await fixtures.household()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    await getRuntimeDb().db.delete(contactSubscriptions).where(eq(contactSubscriptions.contactId, home.contact.id))
    await sendMail({ sendId: home.sendId }, ctx)
    expect(mailer.calls).toHaveLength(0)
  })

  test('complaint threshold pauses before the first delivery', async () => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    const history = await db.insert(contactsTable).values(Array.from({ length: 50 }, (_, index) => ({ accountId: home.accountId, name: `History ${index}`, email: `history-${index}-${home.accountId}@example.com`, addressRaw: home.contact.addressRaw, status: 'matched' as const, parcelId: home.parcelId }))).returning()
    const [past] = await db.insert(sends).values({ accountId: home.accountId, scheduledFor: new Date(AUDIT_NOW.getTime() - 1000), state: 'done' }).returning()
    await db.insert(sendRecipients).values(history.map((person) => ({ sendId: past.id, contactId: person.id, sentAt: AUDIT_NOW })))
    await db.insert(mailEvents).values({ email: history[0].email, kind: 'spam_complaint', createdAt: AUDIT_NOW })
    await expect(sendMail({ sendId: home.sendId }, ctx)).rejects.toThrow(/still unsent/)
    const [account] = await db.select().from(accounts).where(eq(accounts.id, home.accountId))
    expect(account.paused).toBe(true)
    expect(mailer.calls).toHaveLength(0)
    await db.delete(mailEvents).where(eq(mailEvents.email, history[0].email!))
  })

  test('backoff cannot erase a job’s original enqueue identity', async () => {
    const home = await fixtures.household()
    const original = new Date('2030-01-01T00:00:00Z')
    const payload = { accountId: home.accountId, audit: 'stable-enqueue' }
    const first = await enqueue('build_call_lists', payload, original)
    await getRuntimeDb().db.update(jobs).set({ runAfter: new Date(original.getTime() + 60_000) }).where(eq(jobs.id, first.id))
    const again = await enqueue('build_call_lists', payload, original)
    expect(again).toEqual({ id: first.id, created: false })
  })

  test('a tick after the send day recovers the most recent due send only', async () => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await db.update(accounts).set({ sendDay: 15, sendTime: '09:00', timezone: 'America/Los_Angeles', createdAt: new Date('2026-01-01') }).where(eq(accounts.id, home.accountId))
    await scheduleAccountById(home.accountId, AUDIT_NOW)
    await scheduleAccountById(home.accountId, AUDIT_NOW)
    const queued = await db.select().from(jobs).where(sql`${jobs.payload}->>'accountId' = ${home.accountId}`)
    expect(queued.filter((job) => job.kind === 'compose')).toHaveLength(1)
    const rows = await db.select().from(sends).where(eq(sends.accountId, home.accountId))
    expect(rows.map((row) => row.scheduledFor.toISOString())).toContain('2026-10-15T16:00:00.000Z')
    expect(rows).toHaveLength(2)
  })

  test('the job claimer leaves send attempts untouched while compose is pending', async () => {
    const home = await fixtures.household()
    const when = new Date('1900-01-01T00:00:00Z')
    const queued = await enqueue('send', { sendId: home.sendId }, when)
    // Other due jobs may be claimed; the target must remain untouched.
    await claimNextJob(getRuntimeDb().client, new Date('1900-01-02T00:00:00Z'))
    const [job] = await getRuntimeDb().db.select().from(jobs).where(eq(jobs.id, queued.id))
    expect(job.attempts).toBe(0)
    await getRuntimeDb().db.delete(jobs).where(eq(jobs.id, queued.id))
  })
})
