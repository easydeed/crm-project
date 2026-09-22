import { loadDatabaseUrl } from '../src/config/database-url'
import { backfillNoParcelKind } from '../src/db/backfill-no-parcel-kind'
import { createDb } from '../src/db/client'

async function main() {
  const { client, db } = createDb(loadDatabaseUrl())
  const result = await backfillNoParcelKind(db)
  console.log(
    `Backfilled no_parcel_kind on ${result.updated} of ${result.total} no_parcel rows.`,
  )
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
