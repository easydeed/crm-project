import { z } from 'zod'
import { isLocalDatabaseUrl, loadDatabaseUrl } from '../src/config/database-url'
import { createDb } from '../src/db/client'
import { seedFixtures } from './seed-core'

const env = z
  .object({
    DATABASE_URL: z.string().min(1),
  })
  .parse({ DATABASE_URL: loadDatabaseUrl() })

// The seed truncates every table, so it runs only against a database on this machine: the same
// check, by host, that e2e-setup uses.
if (!isLocalDatabaseUrl(env.DATABASE_URL)) {
  let host = 'an unreadable URL'
  try {
    host = new URL(env.DATABASE_URL).hostname
  } catch {}
  console.error(`seed refuses to run: DATABASE_URL points at ${host}, not a database on this machine. It truncates every table.`)
  process.exit(1)
}

async function seed() {
  const { client, db } = createDb(env.DATABASE_URL)
  await seedFixtures(client, db)
  await client.end()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
