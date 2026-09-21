import { loadDatabaseUrl } from '../src/config/database-url'
import { createDb } from '../src/db/client'

async function main() {
  const { client } = createDb(loadDatabaseUrl())
  await client.unsafe('create extension if not exists pg_trgm')
  const rows = await client.unsafe<{ extname: string }[]>(
    `select extname from pg_extension where extname = 'pg_trgm'`,
  )
  console.log(`pg_trgm: ${rows[0]?.extname ?? 'missing'}`)
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
