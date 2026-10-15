import { and, count, eq, ilike, inArray, ne, sql } from 'drizzle-orm'
import type { createDb } from '@/db/client'
import { liveBonitaSales, liveOakdaleEvents, LIVE_HOUSES, PREVIEW_STREET } from '@/db/fixtures/e2e-live'
import { AGENT_ID, buildLaVerneFixtures } from '@/db/fixtures/la-verne'
import { contactsTable, liveContacts } from '@/db/live-contacts'
import { persistReviewCandidates } from '@/db/persist-review-candidates'
import { accounts, contactMatchCandidates, parcelEvents, parcels } from '@/db/schema'

type Db = ReturnType<typeof createDb>['db']

/**
 * Fills the hosted demo's database with the La Verne fixture (OR-050). It only inserts: nothing is
 * truncated or deleted, and a rerun adds nothing. A rerun does three things on purpose: it sets the
 * demo agent's password again, moves the live street events to dates counted from `now`, so the
 * call tags don't expire (OR-043), and the caller rebuilds this month's call list.
 *
 * A database holding any other account is not the demo database, and is refused before any write.
 */
export async function seedDemo(db: Db, passwordHash: string, now: Date) {
  const others = await db.select({ email: accounts.email }).from(accounts).where(ne(accounts.id, AGENT_ID)).limit(1)
  if (others.length) {
    throw new Error('This database has accounts other than the demo agent, so it is not the demo database. Nothing was written.')
  }

  const fixture = buildLaVerneFixtures()
  await db.insert(accounts).values({ ...fixture.agent, passwordHash }).onConflictDoNothing()
  await db.update(accounts).set({ passwordHash, sendTime: '09:00' }).where(eq(accounts.id, AGENT_ID))
  await db.insert(parcels).values(fixture.parcels).onConflictDoNothing()
  await db
    .insert(contactsTable)
    .values(fixture.contacts.map((contact) => ({ ...contact, accountId: AGENT_ID })))
    .onConflictDoNothing()
  await db.insert(parcelEvents).values(fixture.parcelEvents).onConflictDoNothing()

  // The review queue's candidates have no fixed ids, so they are written once, on the first run.
  // Deleted people's candidates count too, deliberately: this asks only whether the rows exist.
  const reviewIds = fixture.reviewContacts.map((row) => row.id)
  const [written] = await db.select({ n: sql<number>`count(*)::int` }).from(contactMatchCandidates).where(inArray(contactMatchCandidates.contactId, reviewIds))
  if (!written?.n) await persistReviewCandidates(db, fixture.reviewContacts)

  await addLiveStreets(db, now)
}

/** The browser pass's dated street events (src/db/fixtures/e2e-live.ts), so the call list has its tags. */
async function addLiveStreets(db: Db, now: Date) {
  const streets = [
    { template: '1840 Oakdale Ave', street: 'Oakdale Ave', houses: LIVE_HOUSES, events: liveOakdaleEvents(now) },
    { ...PREVIEW_STREET, events: liveBonitaSales(now) },
  ]
  for (const { template, street, houses, events } of streets) {
    const [shape] = await db.select().from(parcels).where(eq(parcels.address, template))
    if (!shape) throw new Error(`The fixture has no ${template}`)
    const { id: _id, ...copy } = shape
    for (const house of houses) {
      await db.insert(parcels).values({ ...copy, apn: `E2E-${house}`, address: `${house} ${street}` }).onConflictDoNothing()
    }
    const onStreet = await db
      .select({ id: parcels.id, address: parcels.address })
      .from(parcels)
      .where(and(eq(parcels.zip, copy.zip), ilike(parcels.address, `% ${street}`)))
    for (const event of events) {
      const parcelId = onStreet.find((row) => row.address === `${event.house} ${street}`)?.id
      if (!parcelId) throw new Error(`No parcel at ${event.house} ${street}`)
      await db
        .insert(parcelEvents)
        .values({ parcelId, county: copy.county, kind: event.kind, docNumber: event.docNumber, recordedAt: event.recordedAt, amount: event.amount })
        .onConflictDoUpdate({ target: [parcelEvents.county, parcelEvents.docNumber], set: { recordedAt: event.recordedAt } })
    }
  }
}

/** What the demo holds, for the seeder's last line. People are the live ones. */
export async function demoCounts(db: Db) {
  const [people] = await db.select({ n: count() }).from(liveContacts).where(eq(liveContacts.accountId, AGENT_ID))
  const [row] = await db
    .select({
      parcels: sql<number>`(select count(*)::int from parcels)`,
      events: sql<number>`(select count(*)::int from parcel_events)`,
      candidates: sql<number>`(select count(*)::int from contact_match_candidates)`,
      callList: sql<number>`(select count(*)::int from call_list_entries where account_id = ${AGENT_ID})`,
    })
    .from(accounts)
    .where(eq(accounts.id, AGENT_ID))
  return row ? { ...row, contacts: people?.n ?? 0 } : undefined
}
