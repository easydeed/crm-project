/**
 * Prepares a scratch database for the browser tests: a known password for the seeded
 * agent, an active plan, this month's call list, and the ids the specs visit.
 *
 * It sets a password, so it refuses any database that is not on this machine. The check
 * is on the host in DATABASE_URL, not on a flag anyone could set.
 */
import { writeFileSync } from 'node:fs'
import { and, asc, eq, ilike, not } from 'drizzle-orm'
import { isLocalDatabaseUrl } from '../src/config/database-url'

const url = process.env.DATABASE_URL
if (!isLocalDatabaseUrl(url)) {
  console.error('e2e-setup refuses to run: DATABASE_URL is not a database on this machine.')
  process.exit(1)
}
process.env.ONRECORD_E2E = '1'

export const E2E_EMAIL = 'dana@coastline.example'
export const E2E_PASSWORD = 'e2e-local-scratch-only'

async function main() {
  const { hashPassword } = await import('../src/auth/password')
  const { getRuntimeDb, resetRuntimeDb } = await import('../src/db/runtime')
  const { accounts, contacts, parcelEvents, parcels, subscriptions } = await import('../src/db/schema')
  const { callListEntries } = await import('../src/db/schema-call-lists')
  const { AGENT_ID } = await import('../src/db/fixtures/la-verne')
  const { buildCallLists } = await import('../src/jobs/build-call-lists')
  const { signUnsubscribeToken } = await import('../src/unsubscribe/token')

  const { db } = getRuntimeDb()
  await db.update(accounts).set({ passwordHash: await hashPassword(E2E_PASSWORD) }).where(eq(accounts.id, AGENT_ID))
  await db
    .insert(subscriptions)
    .values({ accountId: AGENT_ID, stripeCustomerId: 'cus_e2e', stripeSubId: 'sub_e2e', plan: 'base', status: 'active', currentPeriodEnd: new Date('2099-01-01') })
    .onConflictDoNothing()
  const now = new Date()

  // A second agent whose people have nothing recent, for the quiet dashboard (OR-043). Its three
  // people are copies of Dana's, on parcels away from Oakdale, so no event reaches them.
  const { quietAgent, quietContactId, QUIET_AGENT_ID } = await import('../src/db/fixtures/e2e-live')
  await db.insert(accounts).values({ ...quietAgent, passwordHash: await hashPassword(E2E_PASSWORD) }).onConflictDoNothing()
  await db
    .insert(subscriptions)
    .values({ accountId: QUIET_AGENT_ID, stripeCustomerId: 'cus_e2e_quiet', stripeSubId: 'sub_e2e_quiet', plan: 'base', status: 'active', currentPeriodEnd: new Date('2099-01-01') })
    .onConflictDoNothing()
  const away = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.accountId, AGENT_ID), eq(contacts.status, 'matched'), not(ilike(contacts.addressRaw, '%Oakdale%'))))
    .orderBy(asc(contacts.name))
    .limit(3)
  for (const [index, row] of away.entries()) {
    const { id: _id, createdAt: _created, updatedAt: _updated, ...copy } = row as typeof row & { createdAt?: unknown; updatedAt?: unknown }
    await db.insert(contacts).values({ ...copy, id: quietContactId(index), accountId: QUIET_AGENT_ID }).onConflictDoNothing()
  }

  // Events dated from this run (OR-043), so the seeded agent's three Oakdale people carry three
  // different call tags every month, and the previewed person has a note (OR-043a). New parcels
  // copy the shape of a seeded house on the same street.
  const { liveOakdaleEvents, liveBonitaSales, LIVE_HOUSES, PREVIEW_STREET, PREVIEW_PERSON, CALL_TAG_KINDS } = await import('../src/db/fixtures/e2e-live')
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

  const [person] = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.accountId, AGENT_ID), eq(contacts.status, 'matched')))
    // The same person every run, so the desktop screenshots compare like for like.
    .orderBy(asc(contacts.name), asc(contacts.email))
    .limit(1)
  if (!person) throw new Error('The seed has no matched person')

  // Fail here too (OR-043a): settings and person-detail preview this person, and a skipped note
  // renders cleanly, so a preview with no email looked like a working one for every capture.
  const [named] = await db.select({ id: contacts.id }).from(contacts).where(and(eq(contacts.accountId, AGENT_ID), eq(contacts.name, PREVIEW_PERSON)))
  if (named?.id !== person.id) throw new Error(`The previews no longer show ${PREVIEW_PERSON}: move the live street sales to whoever they show`)
  const { buildDigestInput } = await import('../src/digest/build-input')
  const { renderDigest } = await import('../src/digest/render')
  const input = await buildDigestInput(db, AGENT_ID, person.id, now)
  const note = input ? renderDigest(input) : null
  if (!note?.send) throw new Error(`${PREVIEW_PERSON}'s note is skipped: the live street sales no longer reach it`)
  if (!note.blocks.includes('street_sales')) throw new Error(`${PREVIEW_PERSON}'s note has no street sales`)
  const state = {
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
    quietEmail: quietAgent.email,
    personId: person.id,
    unsubscribeToken: signUnsubscribeToken(person.id, 'monthly'),
  }
  writeFileSync('e2e/.state.json', JSON.stringify(state, null, 2))
  console.log(`e2e setup ready: person ${person.id}`)
  await resetRuntimeDb()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
