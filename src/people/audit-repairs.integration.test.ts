import { eq } from 'drizzle-orm'
import { afterAll, describe, expect, test } from 'vitest'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb } from '@/db/runtime'
import { contactsTable, liveContacts } from '@/db/live-contacts'
import { accounts, contactSubscriptions, mlsListings } from '@/db/schema'
import { saveContact } from '@/people/save-contact'
import { leaveOutReviewContact, undoReviewDecision } from '@/people/save-review'
import { snapshotFor } from '@/db/review-write'
import { loadHomeSend } from '@/app/app/home-send'
import { suppress } from '@/suppression/suppressions'
import { buildDigestInput } from '@/digest/build-input'
import { importContacts } from '@/import/import-contacts'
import { auditFixtures, AUDIT_NOW } from '@/test/audit-fixtures'

describe.skipIf(!tryLoadIntegrationDatabaseUrl())('OR-055 people and real preview regressions', () => {
  const fixtures = auditFixtures()
  const listingIds: string[] = []
  const session = (accountId: string) => ({ accountId, role: 'agent' as const, exp: Math.floor(Date.now() / 1000) + 60 })
  afterAll(async () => {
    for (const id of listingIds) await getRuntimeDb().db.delete(mlsListings).where(eq(mlsListings.id, id))
    await fixtures.cleanup()
  })

  test('an email-less homeowner can save other fields without becoming sendable', async () => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await db.update(contactsTable).set({ email: null }).where(eq(contactsTable.id, home.contact.id))
    const form = new FormData()
    Object.entries({ contactId: home.contact.id, name: 'New name', email: '', address: home.contact.addressRaw, phone: '909-555-0199', closeDate: '2020-02-29', notes: 'Test note' }).forEach(([key, value]) => form.set(key, value))
    expect(await saveContact(session(home.accountId), form)).toHaveProperty('savedAt')
    const [person] = await db.select().from(liveContacts).where(eq(liveContacts.id, home.contact.id))
    expect(person).toMatchObject({ email: null, name: 'New name', phone: '9095550199', closeDate: '2020-02-29', notes: 'Test note' })
  })

  test('only server-issued Undo can restore a decision, once, for the same account', async () => {
    const home = await fixtures.household()
    const other = await fixtures.household()
    const before = await snapshotFor(home.accountId, home.contact.id)
    const form = new FormData()
    form.set('contactId', home.contact.id)
    const decision = await leaveOutReviewContact(session(home.accountId), form)
    expect(decision.undoToken).toBeTruthy()
    const forged = new FormData()
    forged.set('snapshot', JSON.stringify(before))
    expect(await undoReviewDecision(session(home.accountId), forged)).toHaveProperty('error')
    forged.set('undoToken', decision.undoToken!)
    expect(await undoReviewDecision(session(other.accountId), forged)).toHaveProperty('error')
    expect(await undoReviewDecision(session(home.accountId), forged)).toMatchObject({ undone: true })
    expect(await undoReviewDecision(session(home.accountId), forged)).toHaveProperty('error')
    expect({ ...await snapshotFor(home.accountId, home.contact.id), version: 0 }).toEqual({ ...before, version: 0 })
    const laterDecision = await leaveOutReviewContact(session(home.accountId), form)
    expect(laterDecision.undoToken).toBeTruthy()
    // Even if the visible match state becomes identical again, the old proof is spent.
    expect(await undoReviewDecision(session(home.accountId), forged)).toHaveProperty('error')
  })

  test('Undo cannot overwrite a later edit', async () => {
    const home = await fixtures.household()
    const form = new FormData()
    form.set('contactId', home.contact.id)
    const decision = await leaveOutReviewContact(session(home.accountId), form)
    await getRuntimeDb().db.update(contactsTable).set({ addressRaw: 'New house' }).where(eq(contactsTable.id, home.contact.id))
    form.set('undoToken', decision.undoToken!)
    expect(await undoReviewDecision(session(home.accountId), form)).toHaveProperty('error')
    expect((await snapshotFor(home.accountId, home.contact.id))?.addressRaw).toBe('New house')
  })

  test('dashboard count and preview exclude missing emails and global suppression', async () => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await db.update(accounts).set({ sendDay: 15, sendTime: '09:00', timezone: 'America/Los_Angeles' }).where(eq(accounts.id, home.accountId))
    expect(await loadHomeSend(home.accountId, AUDIT_NOW)).toMatchObject({ kind: 'scheduled', previewContactId: home.contact.id })
    await db.update(contactsTable).set({ email: null }).where(eq(contactsTable.id, home.contact.id))
    expect(await loadHomeSend(home.accountId, AUDIT_NOW)).toEqual({ kind: 'none-subscribed' })
    await db.update(contactsTable).set({ email: home.contact.email }).where(eq(contactsTable.id, home.contact.id))
    await suppress(db, home.contact.email!, 'unsubscribed', 'monthly', 'one_click')
    // Even with a stale active contact subscription, the global suppression wins.
    await db.update(contactSubscriptions).set({ unsubscribedAt: null }).where(eq(contactSubscriptions.contactId, home.contact.id))
    expect(await loadHomeSend(home.accountId, AUDIT_NOW)).toEqual({ kind: 'none-subscribed' })
  })

  test('the DB-backed note loads a real same-street MLS listing with attribution', async () => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    const [listing] = await db.insert(mlsListings).values({ mlsId: `audit-${home.accountId}`, zip: '91750', address: `1144 ${home.street}`, status: 'Active', listDate: '2026-10-01', listPrice: 950000, listingOffice: 'Fixture Realty', listingAgent: 'Fixture Agent', propertyType: 'SFR' }).returning()
    listingIds.push(listing.id)
    const input = await buildDigestInput(db, home.accountId, home.contact.id, AUDIT_NOW)
    expect(input?.nearbyListing).toMatchObject({ mlsId: listing.mlsId, listingOffice: 'Fixture Realty', listingAgent: 'Fixture Agent' })
    await db.update(mlsListings).set({ listDate: '2026-11-01' }).where(eq(mlsListings.id, listing.id))
    expect((await buildDigestInput(db, home.accountId, home.contact.id, AUDIT_NOW))?.nearbyListing).toBeNull()
  })

  test('CSV phone and date validation happens at the write boundary', async () => {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    const base = { line: 1, name: 'Imported', email: `import-${home.accountId}@example.com`, address: home.contact.addressRaw, closeDate: '2026-02-31', phone: '9095550123' }
    expect((await importContacts(db, home.accountId, [base])).skipped[0]?.reason).toContain('real close date')
    const result = await importContacts(db, home.accountId, [{ ...base, closeDate: '2024-02-29', phone: '(909) 555-0123' }])
    expect(result.added).toBe(1)
    const [person] = await db.select().from(liveContacts).where(eq(liveContacts.email, base.email))
    expect(person.phone).toBe('9095550123')
  })
})
