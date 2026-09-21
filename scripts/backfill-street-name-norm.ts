import { loadDatabaseUrl } from '../src/config/database-url'
import { backfillStreetNameNorm } from '../src/db/backfill-street-name-norm'
import { createDb } from '../src/db/client'

async function main() {
  const { client, db } = createDb(loadDatabaseUrl())
  await client.unsafe('create extension if not exists pg_trgm')
  const result = await backfillStreetNameNorm(db)
  console.log(
    `Backfilled street_name_norm on ${result.updated} of ${result.total} parcels.`,
  )
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
