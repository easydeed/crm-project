import { randomUUID } from 'node:crypto'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { loadCallList } from '@/app/app/call-list-data'
import { loadHomeSend } from '@/app/app/home-send'
import { GET, POST } from '@/app/u/[token]/route'
import { registerAccount } from '@/auth/register-account'
import { countContactsForAccount } from '@/db/accounts'
import { listAccountsForAdmin } from '@/db/admin-accounts'
import { loadDeliverabilityForAdmin } from '@/db/admin-deliverability'
import { listMatchingFailuresForAdmin } from '@/db/admin-matching'
import { findContactForAdminPreview } from '@/db/admin-preview'
import { getSendForAdmin } from '@/db/admin-sends'
import { deleteContactsForAccount, updateContactForAccount } from '@/db/contact-write'
import { getContactForAccount, listContactsForAccount } from '@/db/contacts'
import { loadDeliveryTotals } from '@/db/delivery-window'
import { addContactsToGroup, createGroupForAccount, listGroupsForAccount } from '@/db/groups'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { withStreetNameNorm } from '@/db/parcel-write'
import { getReviewItemForAccount, listReviewQueueForAccount } from '@/db/review-queue'
import { leaveOutContactForAccount } from '@/db/review-write'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import { accounts, contactSubscriptions, contacts, groupMembers, parcelEvents, parcels, sendRecipients, sends } from '@/db/schema'
import { callListEntries } from '@/db/schema-call-lists'
import { buildDigestInput } from '@/digest/build-input'
import { GRANT_DEED } from '@/digest/types'
import { importContacts } from '@/import/import-contacts'
import { buildCallLists } from '@/jobs/build-call-lists'
import { callListPeriod } from '@/jobs/call-list-period'
import { composeSend } from '@/jobs/compose'
import { sendMail } from '@/jobs/send-job'
import { setMailer } from '@/mail/current'
import { FakeMailer } from '@/mail/fake-mailer'
import { PostmarkMailer } from '@/mail/postmark-mailer'
import { recordPostmarkEvent } from '@/mail/postmark-webhook'
import { suppress } from '@/suppression/suppressions'
import { signUnsubscribeToken } from '@/unsubscribe/token'

const databaseUrl = tryLoadIntegrationDatabaseUrl()
const now = new Date()
const ctx = { jobId: 'or006a', attempt: 1, now }

describe.skipIf(!databaseUrl)('OR-006a soft delete: gone from every live read, kept where it must be', () => {
  const mailer = new FakeMailer()
  let accountId = ''
  let adminId = ''
  let live = ''
  let gone = ''
  let review = ''
  let goneEmail = ''
  let sendId = ''

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
    setMailer(mailer)
    process.env.MAIL_FROM_MONTHLY = 'notes@example.com'
    process.env.SEND_ENABLED = 'true'
    process.env.SEND_ALLOWLIST = 'example.com'
    const { db } = getRuntimeDb()
    const register = async (label: string) => {
      const created = await registerAccount({ name: `OR006a ${label}`, email: `or006a-${label}-${randomUUID()}@example.com`, password: 'long-enough-password', brokerage: 'Hill Realty', dre: '02000601', phone: '909-555-0161' })
      if (!created.ok) throw new Error('could not register')
      return created.accountId
    }
    accountId = await register('agent')
    adminId = await register('admin')
    await db.update(accounts).set({ role: 'admin' }).where(eq(accounts.id, adminId))
    await db.update(accounts).set({ sendDay: 15, sendTime: '09:00', timezone: 'America/Los_Angeles' }).where(eq(accounts.id, accountId))
    const name = `Soft${accountId.slice(0, 6)} Ave`
    const zip = `9${Math.floor(1000 + Math.random() * 8999)}`
    const houses = [1142, 1162, 1108].map((n) => withStreetNameNorm({ id: randomUUID(), apn: `OR006A-${randomUUID().slice(0, 8)}`, county: 'Los Angeles', address: `${n} ${name}`, city: 'La Verne', zip, beds: 3, baths: '2.0', sqft: 1680, useCode: 'SFR' }))
    await db.insert(parcels).values(houses)
    await db.insert(parcelEvents).values({ parcelId: houses[2]!.id!, county: 'Los Angeles', kind: GRANT_DEED, docNumber: `SD-${accountId.slice(0, 8)}`, recordedAt: new Date(now.getTime() - 10 * 864e5).toISOString().slice(0, 10), amount: 1_000_000, party: 'Neighbor', raw: {} })
    goneEmail = `gone-${randomUUID().slice(0, 8)}@example.com`
    const row = (line: number, house: number, email: string) => ({ line, name: `Person ${line}`, email, address: `${house} ${name}, La Verne, CA ${zip}`, closeDate: null })
    await importContacts(db, accountId, [row(2, 1142, `live-${randomUUID().slice(0, 8)}@example.com`), row(3, 1162, goneEmail)])
    const people = await db.select({ id: contacts.id, email: contacts.email }).from(contacts).where(eq(contacts.accountId, accountId))
    live = people.find((p) => p.email !== goneEmail)!.id
    gone = people.find((p) => p.email === goneEmail)!.id
    review = randomUUID()
    await db.insert(contacts).values({ id: review, accountId, name: 'Needs Look', email: `review-${randomUUID().slice(0, 8)}@example.com`, addressRaw: '9 Nowhere Rd', status: 'needs_review' })
    const [send] = await db.insert(sends).values({ accountId, scheduledFor: new Date(now.getTime() - 864e5), state: 'scheduled' }).returning()
    sendId = send!.id
    await composeSend({ accountId, sendId }, ctx)
    await db.update(sendRecipients).set({ sentAt: now, providerId: 'fake-history' }).where(and(eq(sendRecipients.sendId, sendId), eq(sendRecipients.contactId, gone)))
    await db.insert(callListEntries).values({ accountId, contactId: gone, kind: 'quiet_a_while', detail: 'x', score: 30, period: callListPeriod(now, 'America/Los_Angeles') })
    expect(await deleteContactsForAccount(accountId, [gone, review])).toBe(2)
  })

  afterAll(async () => {
    setMailer(new PostmarkMailer())
    delete process.env.MAIL_FROM_MONTHLY
    delete process.env.SEND_ENABLED
    delete process.env.SEND_ALLOWLIST
    const { db, client } = getRuntimeDb()
    await db.delete(accounts).where(inArray(accounts.id, [accountId, adminId]))
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  test('people list, detail, counts, dashboard', async () => {
    expect((await listContactsForAccount(accountId)).map((p) => p.id)).toEqual([live])
    expect(await getContactForAccount(accountId, gone)).toBeNull()
    expect(await countContactsForAccount(accountId)).toBe(1)
    const home = await loadHomeSend(accountId, now)
    if (home.kind === 'scheduled') expect(home.sentence).toContain('to 1 homeowner.')
    else expect(home.kind).toBe('scheduled')
    expect((await listAccountsForAdmin(adminId, { q: accountId.slice(0, 0) })).find((a) => a.id === accountId)?.contactCount).toBe(1)
  })

  test('compose, send, digest, call lists', async () => {
    const { db } = getRuntimeDb()
    const [next] = await db.insert(sends).values({ accountId, scheduledFor: new Date(now.getTime() + 864e5), state: 'scheduled' }).returning()
    await composeSend({ accountId, sendId: next!.id }, ctx)
    expect((await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, next!.id))).map((r) => r.contactId)).toEqual([live])
    await db.update(sendRecipients).set({ sentAt: null, providerId: null }).where(and(eq(sendRecipients.sendId, sendId), eq(sendRecipients.contactId, gone)))
    await sendMail({ sendId }, ctx)
    const [stale] = await db.select().from(sendRecipients).where(and(eq(sendRecipients.sendId, sendId), eq(sendRecipients.contactId, gone)))
    expect(stale).toMatchObject({ sentAt: null, permanentFailure: true, error: 'Contact not found' })
    expect(mailer.calls.some((call) => call.to === goneEmail)).toBe(false)
    await db.update(sendRecipients).set({ sentAt: now, providerId: 'fake-history', error: null, permanentFailure: false }).where(eq(sendRecipients.id, stale!.id))
    expect(await buildDigestInput(db, accountId, gone, now)).toBeNull()
    const list = await loadCallList(accountId, now)
    expect(list.kind === 'list' && list.entries.some((e) => e.contactId === gone)).toBe(false)
    await buildCallLists({ accountId, asOf: now.toISOString() }, ctx)
    const built = await db.select({ contactId: callListEntries.contactId }).from(callListEntries).where(eq(callListEntries.accountId, accountId))
    expect(built.map((r) => r.contactId)).not.toContain(review)
  })

  test('review queue, groups, admin preview, admin matching, edits', async () => {
    expect((await listReviewQueueForAccount(accountId)).map((r) => r.id)).not.toContain(review)
    expect(await getReviewItemForAccount(accountId, review)).toBeNull()
    expect((await leaveOutContactForAccount(accountId, review)).ok).toBe(false)
    const group = await createGroupForAccount(accountId, `G ${randomUUID().slice(0, 6)}`)
    if (!group.ok) throw new Error('group')
    await addContactsToGroup(accountId, group.group.id, [gone])
    expect(await getRuntimeDb().db.select().from(groupMembers).where(eq(groupMembers.groupId, group.group.id))).toHaveLength(0)
    // A member deleted after joining keeps the row but is not counted.
    await getRuntimeDb().db.insert(groupMembers).values({ groupId: group.group.id, contactId: gone })
    await addContactsToGroup(accountId, group.group.id, [live])
    expect((await listGroupsForAccount(accountId)).find((g) => g.id === group.group.id)?.count).toBe(1)
    expect(await findContactForAdminPreview(gone)).toBeNull()
    expect((await listMatchingFailuresForAdmin(adminId, { accountId })).map((r) => r.contactId)).not.toContain(review)
    const edit = await updateContactForAccount(accountId, gone, { name: 'x', email: goneEmail, phone: null, addressRaw: 'x', closeDate: null, notes: null })
    expect(edit.ok).toBe(false)
    expect(await deleteContactsForAccount(accountId, [gone])).toBe(0)
  })

  test('admin suppression list shows an address only for a live contact', async () => {
    await suppress(getRuntimeDb().db, goneEmail, 'bounced', 'all', 'postmark_webhook')
    const view = await loadDeliverabilityForAdmin(adminId)
    expect(view!.suppressed.some((row) => row.email === goneEmail)).toBe(false)
  })

  test('the allowlisted readers still see the deleted person', async () => {
    const token = signUnsubscribeToken(gone, 'monthly')
    const page = await GET(new Request(`http://localhost:3000/u/${token}`), { params: Promise.resolve({ token }) })
    expect(page.status).toBe(200)
    const detail = await getSendForAdmin(adminId, sendId)
    const kept = detail!.composed.find((r) => r.email === goneEmail)
    expect(kept?.html).toContain('<')
    await recordPostmarkEvent({ RecordType: 'Bounce', Type: 'HardBounce', Email: goneEmail })
    const [sub] = await getRuntimeDb().db.select().from(contactSubscriptions).where(eq(contactSubscriptions.contactId, gone))
    expect(sub?.unsubscribedAt).toBeInstanceOf(Date)
    const totals = await loadDeliveryTotals(now, accountId)
    expect(totals.sent).toBeGreaterThanOrEqual(1)
    await POST(new Request(`http://localhost:3000/u/${token}`, { method: 'POST' }), { params: Promise.resolve({ token }) })
  })

  test('send history survives the delete: html, sent_at, provider_id', async () => {
    const [row] = await getRuntimeDb().db.select().from(sendRecipients).where(and(eq(sendRecipients.sendId, sendId), eq(sendRecipients.contactId, gone)))
    expect(row?.html).toContain('<')
    expect(row?.sentAt).toBeInstanceOf(Date)
    expect(row?.providerId).toBe('fake-history')
  })

  test('re-import restores the row with its subscription state intact', async () => {
    const { db } = getRuntimeDb()
    const summary = await importContacts(db, accountId, [{ line: 2, name: 'Back Again', email: goneEmail.toUpperCase(), address: '1 Else St', closeDate: null }])
    expect(summary).toMatchObject({ added: 0, restored: 1 })
    const [back] = await db.select().from(contacts).where(eq(contacts.id, gone))
    expect(back?.deletedAt).toBeNull()
    const [sub] = await db.select().from(contactSubscriptions).where(eq(contactSubscriptions.contactId, gone))
    expect(sub?.unsubscribedAt).toBeInstanceOf(Date)
    expect(await db.execute(sql`select count(*)::int as n from contacts where account_id = ${accountId}`)).toEqual([{ n: 3 }])
  })
})
