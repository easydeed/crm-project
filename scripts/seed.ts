import { z } from 'zod'
import { loadDatabaseUrl } from '../src/config/database-url'
import { createDb } from '../src/db/client'
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
  const { client, db } = createDb(env.DATABASE_URL)
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
      contact_match_candidates,
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

  const [counts] = await client`
    select
      (select count(*)::int from accounts) as agents,
      (select count(*)::int from contacts) as contacts,
      (select count(*)::int from contacts where status <> 'matched') as unmatched,
      (select count(*)::int from contacts where address_raw ilike 'PO Box%') as po_boxes,
      (select count(*)::int from parcel_events pe
        join parcels p on p.id = pe.parcel_id
        where p.address like '%Oakdale Ave') as oakdale_sales
  `

  console.log(
    `Seeded ${fixture.agent.name}: ${counts.contacts} contacts, ${counts.unmatched} unmatched, ${counts.po_boxes} PO Box, ${counts.oakdale_sales} Oakdale sales, ${counts.agents} agent.`,
  )

  await client.end()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
