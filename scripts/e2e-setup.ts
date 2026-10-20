/**
 * Prepares a scratch database for the browser tests: a known password for the seeded
 * agent, an active plan, this month's call list, and the ids the specs visit.
 *
 * It sets a password, so it refuses any database that is not on this machine. The check
 * is on the host in DATABASE_URL, not on a flag anyone could set.
 */
import { writeFileSync } from 'node:fs'
import { and, asc, eq } from 'drizzle-orm'
import { isLocalDatabaseUrl } from '../src/config/database-url'
import { E2E_PASSWORD } from './e2e-password'

const url = process.env.DATABASE_URL
if (!isLocalDatabaseUrl(url)) {
  console.error('e2e-setup refuses to run: DATABASE_URL is not a database on this machine.')
  process.exit(1)
}
process.env.ONRECORD_E2E = '1'

export const E2E_EMAIL = 'dana@coastline.example'
export { E2E_PASSWORD }

async function main() {
  const { getRuntimeDb, resetRuntimeDb } = await import('../src/db/runtime')
  const { contacts } = await import('../src/db/schema')
  const { AGENT_ID } = await import('../src/db/fixtures/la-verne')
  const { signUnsubscribeToken } = await import('../src/unsubscribe/token')

  const { db } = getRuntimeDb()
  const now = new Date()

  // Every agent the captures sign in as, the seeded one included (OR-044a). Each exists for one
  // state, and checkAgents below fails the run if it stops showing it.
  const { buildAgents, checkAgents } = await import('./e2e-agents')
  const { E2E_AGENTS, agentContactId, e2eAgent } = await import('../src/db/fixtures/e2e-agents')
  await buildAgents(db, E2E_PASSWORD)

  // Events dated from this run (OR-043), shared with the hosted demo's seed (OR-050).
  const { buildLiveData } = await import('./live-data')
  await buildLiveData(db, now)
  const { PREVIEW_PERSON } = await import('../src/db/fixtures/e2e-live')

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
  await checkAgents(db, now)

  // The seeded agent's two unmatched shapes, for the person-page and review captures.
  const firstWith = async (status: 'needs_review' | 'no_parcel') => {
    const [row] = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(eq(contacts.accountId, AGENT_ID), eq(contacts.status, status)))
      .orderBy(asc(contacts.name))
      .limit(1)
    if (!row) throw new Error(`The seed has no ${status} person`)
    return row.id
  }
  const state = {
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
    // Everyone the captures sign in as. The admin signs in and clicks View as (Decision B).
    agents: Object.fromEntries(E2E_AGENTS.filter((row) => row.login).map((row) => [row.key, { id: row.id, email: row.email }])),
    personId: person.id,
    needsReviewId: await firstWith('needs_review'),
    noParcelId: await firstWith('no_parcel'),
    groupsPersonId: agentContactId(Number.parseInt(e2eAgent('groups').id.slice(-12), 16), 0),
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
