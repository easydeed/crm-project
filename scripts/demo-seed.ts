/**
 * Migrates and fills the hosted demo's database (OR-050): `pnpm demo:seed`.
 *
 * Reads PREVIEW_DATABASE_URL and DEMO_AGENT_PASSWORD, from the environment or .env.local. Never
 * DATABASE_URL. Safe to rerun: it never truncates or deletes, and it refuses a database holding
 * any account but the demo agent's. docs/PREVIEW.md says where each secret goes.
 */
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { hashPassword } from '../src/auth/password'
import { loadEnvFiles } from '../src/config/database-url'
import { readDemoEnv } from '../src/config/demo-env'
import { createDb } from '../src/db/client'
import { agent } from '../src/db/fixtures/la-verne'

loadEnvFiles()
let demo
try {
  demo = readDemoEnv(process.env)
} catch (err) {
  console.error(`demo-seed refuses to run: ${(err as Error).message}`)
  process.exit(1)
}

async function main(url: string, password: string) {
  const runtime = createDb(url)
  // The call-list job reads the app's runtime database. Here that is the demo database, on the
  // session connection the seeder already holds, not DATABASE_POOLER_URL.
  ;(globalThis as { __onrecordRuntimeDb?: typeof runtime }).__onrecordRuntimeDb = runtime
  const { db, client } = runtime
  try {
    // An empty database migrates from zero. One with tables and no history is refused by drizzle.
    await migrate(db, { migrationsFolder: 'drizzle' })
    const { seedDemo, demoCounts } = await import('../src/db/demo-seed')
    const { buildCallLists } = await import('../src/jobs/build-call-lists')
    const now = new Date()
    await seedDemo(db, await hashPassword(password), now)
    await buildCallLists({ accountId: agent.id, asOf: now.toISOString() }, { jobId: 'demo-seed', attempt: 1, now })
    const counts = await demoCounts(db)
    console.log(
      `Demo ready: sign in as ${agent.email}. ${counts?.contacts} people, ${counts?.parcels} parcels, ${counts?.events} recorded events, ${counts?.candidates} review candidates, ${counts?.callList} on the call list.`,
    )
  } finally {
    await client.end({ timeout: 5 })
  }
}

main(demo.url, demo.password).catch((err) => {
  console.error(`demo-seed failed: ${(err as Error).message}`)
  process.exit(1)
})
