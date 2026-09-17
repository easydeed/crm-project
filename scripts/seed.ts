import { existsSync, readFileSync } from 'node:fs'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { z } from 'zod'
import { buildLaVerneFixtures } from '../src/db/fixtures/la-verne'
import {
  accounts,
  contacts,
  parcelEvents,
  parcels,
} from '../src/db/schema'

function loadEnvFile() {
  if (!existsSync('.env')) return
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    const value = trimmed.slice(eq + 1).replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile()

const env = z
  .object({
    DATABASE_URL: z.string().min(1),
  })
  .parse(process.env)

async function seed() {
  const client = postgres(env.DATABASE_URL, { max: 1 })
  const db = drizzle(client)
  const fixture = buildLaVerneFixtures()

  await client`
    truncate table
      jobs,
      admin_actions,
      account_addons,
      subscriptions,
      events,
      send_recipients,
      sends,
      mls_listings,
      parcel_events,
      group_members,
      groups,
      contact_subscriptions,
      contacts,
      parcels,
      accounts
    cascade
  `

  await db.insert(accounts).values(fixture.agent)
  await db.insert(parcels).values(fixture.parcels)
  await db.insert(contacts).values(
    fixture.contacts.map((contact) => ({
      ...contact,
      accountId: fixture.agent.id,
    })),
  )
  await db.insert(parcelEvents).values(fixture.parcelEvents)

  console.log(
    `Seeded ${fixture.agent.name}: ${fixture.contacts.length} contacts, ${fixture.parcels.length} parcels, ${fixture.parcelEvents.length} parcel events.`,
  )

  await client.end()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
