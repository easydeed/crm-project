import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, test } from 'vitest'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb } from '@/db/runtime'
import { deleteContactsForAccount } from '@/db/contact-write'
import { contactsTable } from '@/db/live-contacts'
import { accounts, contactSubscriptions, sendRecipients, sends } from '@/db/schema'
import { auditFixtures, AUDIT_CONTEXT as ctx } from '@/test/audit-fixtures'
import { composeSend } from '@/jobs/compose'
import { recomposeUnsentSend } from '@/jobs/recompose-send'
import { CHANGED_BEFORE_ATTEMPT } from '@/jobs/delivery-hold'
import { sendMail } from '@/jobs/send-job'
import { setMailer } from '@/mail/current'
import { FakeMailer } from '@/mail/fake-mailer'
import { PostmarkMailer } from '@/mail/postmark-mailer'
import { DeliveryRejectedError } from '@/mail/delivery-error'

describe.skipIf(!tryLoadIntegrationDatabaseUrl())('OR-056 delivery review', () => {
  const fixtures = auditFixtures()
  const env = { ...process.env }
  let mailer: FakeMailer
  beforeEach(() => {
    process.env.SEND_ENABLED = 'true'; process.env.SEND_ALLOWLIST = 'example.com'; process.env.MAIL_FROM_MONTHLY = 'notes@example.com'
    mailer = new FakeMailer(); setMailer(mailer)
  })
  afterAll(async () => { await fixtures.cleanup(); process.env = env; setMailer(new PostmarkMailer()) })

  test.each(['done', 'skipped'] as const)('admin refuses a finished %s send', async (state) => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    await db.update(accounts).set({ role: 'admin' }).where(eq(accounts.id, home.accountId))
    await db.update(sendRecipients).set({ permanentFailure: true, error: CHANGED_BEFORE_ATTEMPT }).where(eq(sendRecipients.sendId, home.sendId))
    await db.update(sends).set({ state }).where(eq(sends.id, home.sendId))
    const before = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId))
    expect(await recomposeUnsentSend(home.accountId, home.sendId)).toBe(false)
    expect(await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId))).toEqual(before)
    expect((await db.select().from(sends).where(eq(sends.id, home.sendId)))[0].state).toBe(state)
  })

  test('active recompose touches only never-attempted held recipients', async () => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    await db.update(accounts).set({ role: 'admin' }).where(eq(accounts.id, home.accountId))
    const [held] = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId))
    await db.update(sendRecipients).set({ permanentFailure: true, error: CHANGED_BEFORE_ATTEMPT }).where(eq(sendRecipients.id, held.id))
    await db.update(contactsTable).set({ name: 'Corrected Homeowner' }).where(eq(contactsTable.id, home.contact.id))
    const [uncertain] = await db.insert(contactsTable).values({ ...home.contact, id: randomUUID(), email: `uncertain-${home.accountId}@example.com` }).returning()
    const [fresh] = await db.insert(contactsTable).values({ ...home.contact, id: randomUUID(), email: `new-${home.accountId}@example.com` }).returning()
    const [prior] = await db.insert(sendRecipients).values({ sendId: home.sendId, contactId: uncertain.id, deliveryClaimedAt: ctx.now, permanentFailure: true, error: 'Delivery outcome unknown.', html: 'Keep original receipt' }).returning()
    expect(await recomposeUnsentSend(home.accountId, home.sendId)).toBe(true)
    const after = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId))
    expect(after.find((row) => row.contactId === home.contact.id)?.html).toContain('Hi Corrected')
    expect(after.find((row) => row.id === prior.id)).toEqual(prior)
    expect(after.some((row) => row.contactId === fresh.id)).toBe(false)
    expect(after).toHaveLength(2)
    expect((await db.select().from(sends).where(eq(sends.id, home.sendId)))[0].state).toBe('ready')
  })

  test('a prior provider refusal cannot be reclassified as never-attempted after an edit', async () => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    mailer.failFor = () => true
    await expect(sendMail({ sendId: home.sendId }, ctx)).rejects.toThrow(/still unsent/)
    await db.update(contactsTable).set({ name: 'Edited after refusal' }).where(eq(contactsTable.id, home.contact.id))
    await sendMail({ sendId: home.sendId }, ctx)
    await db.update(accounts).set({ role: 'admin' }).where(eq(accounts.id, home.accountId))
    await db.update(sends).set({ state: 'ready' }).where(eq(sends.id, home.sendId))
    expect(await recomposeUnsentSend(home.accountId, home.sendId)).toBe(false)
    expect(mailer.calls).toHaveLength(1)
  })

  test('recompose preserves a deleted persons held history', async () => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    await db.update(accounts).set({ role: 'admin' }).where(eq(accounts.id, home.accountId))
    await db.update(sendRecipients).set({ permanentFailure: true, error: CHANGED_BEFORE_ATTEMPT }).where(eq(sendRecipients.sendId, home.sendId))
    const before = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId))
    await deleteContactsForAccount(home.accountId, [home.contact.id])
    expect(await recomposeUnsentSend(home.accountId, home.sendId)).toBe(false)
    expect(await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId))).toEqual(before)
  })

  test('unsubscribing after composition prevents delivery', async () => {
    const home = await fixtures.household()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    await getRuntimeDb().db.update(contactSubscriptions).set({ unsubscribedAt: ctx.now }).where(eq(contactSubscriptions.contactId, home.contact.id))
    await sendMail({ sendId: home.sendId }, ctx)
    expect(mailer.calls).toHaveLength(0)
    const [row] = await getRuntimeDb().db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId))
    expect(row.sentAt).toBeNull(); expect(row.permanentFailure).toBe(true)
  })

  test('older generic stale receipts are ambiguous and remain held', async () => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    await db.update(accounts).set({ role: 'admin' }).where(eq(accounts.id, home.accountId))
    await db.update(sendRecipients).set({ permanentFailure: true, error: 'Person or house changed after composition. Review before sending.' }).where(eq(sendRecipients.sendId, home.sendId))
    const before = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId))
    expect(await recomposeUnsentSend(home.accountId, home.sendId)).toBe(false)
    expect(await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId))).toEqual(before)
  })

  test('an empty provider error still proves an earlier attempt', async () => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    mailer.send = async (message) => { mailer.calls.push(message); throw new DeliveryRejectedError('') }
    await expect(sendMail({ sendId: home.sendId }, ctx)).rejects.toThrow(/still unsent/)
    // #75 stored raw errors, so retain coverage of its historical empty value.
    await db.update(sendRecipients).set({ error: '' }).where(eq(sendRecipients.sendId, home.sendId))
    expect((await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId)))[0].error).toBe('')
    await db.update(contactsTable).set({ name: 'Changed after empty refusal' }).where(eq(contactsTable.id, home.contact.id))
    await sendMail({ sendId: home.sendId }, ctx)
    await db.update(accounts).set({ role: 'admin' }).where(eq(accounts.id, home.accountId))
    await db.update(sends).set({ state: 'ready' }).where(eq(sends.id, home.sendId))
    expect(await recomposeUnsentSend(home.accountId, home.sendId)).toBe(false)
    expect(mailer.calls).toHaveLength(1)
  })

  test('missing composition proof never claims that no provider attempt occurred', async () => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    await db.update(sendRecipients).set({ composedFingerprint: null }).where(eq(sendRecipients.sendId, home.sendId))
    await sendMail({ sendId: home.sendId }, ctx)
    const [row] = await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId))
    expect(row.error).toContain('identity proof is missing')
    expect(row.error).not.toContain('No provider attempt was made')
    expect(mailer.calls).toHaveLength(0)
  })

  test('provider error text cannot forge a pre-attempt hold', async () => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    mailer.send = async (message) => {
      mailer.calls.push(message)
      throw Object.assign(new DeliveryRejectedError(CHANGED_BEFORE_ATTEMPT), { code: 406 })
    }
    await sendMail({ sendId: home.sendId }, ctx)
    await db.update(accounts).set({ role: 'admin' }).where(eq(accounts.id, home.accountId))
    await db.update(sends).set({ state: 'ready' }).where(eq(sends.id, home.sendId))
    expect(await recomposeUnsentSend(home.accountId, home.sendId)).toBe(false)
    expect(mailer.calls).toHaveLength(1)
  })

  test('deleting after composition prevents delivery and preserves history', async () => {
    const home = await fixtures.household()
    await composeSend({ accountId: home.accountId, sendId: home.sendId }, ctx)
    expect(await deleteContactsForAccount(home.accountId, [home.contact.id])).toBe(1)
    await sendMail({ sendId: home.sendId }, ctx)
    expect(mailer.calls).toHaveLength(0)
    const [row] = await getRuntimeDb().db.select().from(sendRecipients).where(eq(sendRecipients.sendId, home.sendId))
    expect(row.sentAt).toBeNull(); expect(row.error).toBe('Contact not found')
  })
})
