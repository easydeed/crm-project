import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { z } from 'zod'
import { loadDatabaseUrl } from '../src/config/database-url'
import { buildLaVerneFixtures } from '../src/db/fixtures/la-verne'
import {
  accounts,
  contacts,
  parcelEvents,
  parcels,
} from '../src/db/schema'

const env = z
  .object({
    DATABASE_URL: z.string().min(1),
  })
  .parse({ DATABASE_URL: loadDatabaseUrl() })

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
