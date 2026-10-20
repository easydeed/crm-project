/**
 * The run-dated events and call lists every e2e agent's screens rely on (OR-043, OR-043a). Shared by
 * e2e-setup (local scratch) and demo-seed (the hosted demo, OR-050), each behind its own guard: this
 * module checks nothing about where it writes, so it is only ever called after one of them.
 */
import { and, eq, ilike } from 'drizzle-orm'
import { AGENT_ID } from '../src/db/fixtures/la-verne'
import { CALL_TAG_KINDS, LIVE_HOUSES, PREVIEW_STREET, QUIET_AGENT_ID, liveBonitaSales, liveOakdaleEvents } from '../src/db/fixtures/e2e-live'
import type { getRuntimeDb } from '../src/db/runtime'
import { parcelEvents, parcels } from '../src/db/schema'
import { callListEntries } from '../src/db/schema-call-lists'
import { buildCallLists } from '../src/jobs/build-call-lists'

type Db = ReturnType<typeof getRuntimeDb>['db']

export async function buildLiveData(db: Db, now: Date) {
  // Events dated from this run (OR-043), so the seeded agent's three Oakdale people carry three
  // different call tags every month, and the previewed person has a note (OR-043a). New parcels
  // copy the shape of a seeded house on the same street.
  const streets = [
    { template: '1840 Oakdale Ave', street: 'Oakdale Ave', houses: LIVE_HOUSES, events: liveOakdaleEvents(now) },
    { ...PREVIEW_STREET, events: liveBonitaSales(now) },
  ]
  for (const { template, street, houses, events } of streets) {
    const [shape] = await db.select().from(parcels).where(eq(parcels.address, template))
    if (!shape) throw new Error(`The seed has no ${template}`)
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
        .onConflictDoNothing()
    }
  }

  for (const accountId of [AGENT_ID, QUIET_AGENT_ID]) {
    await buildCallLists({ accountId, asOf: now.toISOString() }, { jobId: 'e2e', attempt: 1, now })
  }

  // Fail here, not quietly in a screenshot: the captures exist to show these tags.
  const kinds = new Set(
    (await db.select({ kind: callListEntries.kind }).from(callListEntries).where(eq(callListEntries.accountId, AGENT_ID))).map((row) => row.kind),
  )
  const missing = CALL_TAG_KINDS.filter((kind) => !kinds.has(kind))
  if (missing.length) throw new Error(`The seeded agent's call list is missing ${missing.join(', ')}: the live events no longer reach it`)
}
