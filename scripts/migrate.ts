// Applies pending SQL migrations from drizzle/. Non-interactive. Any failure exits 1.
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { loadDatabaseUrl } from '../src/config/database-url'
import { createDb } from '../src/db/client'

const migrationsFolder = 'drizzle'

async function main() {
  const { client, db } = createDb(loadDatabaseUrl())
  try {
    await baselineIfNeeded(client)
    await migrate(db, { migrationsFolder })
    const [row] = await client<{ applied: number }[]>`
      select count(*)::int as applied from drizzle.__drizzle_migrations`
    console.log(`Migrations applied: ${row?.applied ?? 0} of ${readMigrationFiles({ migrationsFolder }).length}.`)
  } finally {
    await client.end({ timeout: 5 })
  }
}

// A database built before migrations existed (crm-dev) has tables but no history.
// MIGRATE_BASELINE=1 records 0000_initial as applied without running it. It is single-use:
// with the flag set, anything other than "tables and no history" refuses and exits 1.
async function baselineIfNeeded(client: ReturnType<typeof createDb>['client']) {
  const requested = process.env.MIGRATE_BASELINE === '1'
  const [state] = await client<{ history: boolean; built: boolean }[]>`
    select
      to_regclass('drizzle.__drizzle_migrations') is not null as history,
      to_regclass('public.accounts') is not null as built`
  let recorded = 0
  if (state?.history) {
    const [row] = await client<{ n: number }[]>`select count(*)::int as n from drizzle.__drizzle_migrations`
    recorded = row?.n ?? 0
  }
  if (recorded > 0) {
    if (requested) {
      throw new Error(
        `Refusing to baseline: this database already records ${recorded} migration(s). A second baseline would mark pending migrations as applied.`,
      )
    }
    return
  }
  if (!state?.built) {
    if (requested) throw new Error('Refusing to baseline: this database is empty. Migrate it from zero instead.')
    return
  }
  if (!requested) {
    throw new Error(
      'This database has tables but no migration history. Baseline it once with MIGRATE_BASELINE=1, then diff it against a from-zero build.',
    )
  }
  const [initial] = readMigrationFiles({ migrationsFolder })
  if (!initial) throw new Error('No initial migration found.')
  await client`create schema if not exists drizzle`
  await client`create table if not exists drizzle.__drizzle_migrations (
    id serial primary key, hash text not null, created_at bigint)`
  await client`insert into drizzle.__drizzle_migrations (hash, created_at)
    values (${initial.hash}, ${initial.folderMillis})`
  console.log('BASELINE: recorded 0000_initial as applied without running it.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
