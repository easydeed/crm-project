/**
 * Seeds the hosted demo (OR-050): crm-preview, never crm-dev or crm, and never a database holding
 * anyone but demo agents. seed.ts and e2e-setup.ts keep their local-only guard; this is a separate
 * door, and demoSeedRefusal (src/config/demo.ts) is its lock.
 *
 *   DATABASE_URL         crm-preview's session pooler (port 5432)
 *   DEMO_PROJECT_REF     crm-preview's project ref; the URL must carry it
 *   DEMO_REFUSED_REFS    optional, comma-separated refs to refuse as well (crm-dev's)
 *   DEMO_AGENT_PASSWORD  the demo agents' password: 16+ characters, never committed
 *
 * The live events are dated from the day it runs: reseed every few weeks to keep the call tags.
 */
import { assertSafeDatabaseUrl } from '../src/config/database-url'
import { DEMO_AGENTS, demoSeedRefusal, refusedRefs } from '../src/config/demo'
import { createDb } from '../src/db/client'
import { setRuntimeDb } from '../src/db/runtime'
import { setBillingGateway } from '../src/billing/current'
import { e2eBillingGateway } from '../src/billing/e2e-gateway'
import { buildAgents, checkAgents } from './e2e-agents'
import { E2E_PASSWORD } from './e2e-password'
import { buildLiveData } from './live-data'
import { seedFixtures } from './seed-core'

async function main() {
  const url = process.env.DATABASE_URL
  const password = process.env.DEMO_AGENT_PASSWORD
  if (url) assertSafeDatabaseUrl(url)
  const handle = createDb(url ?? '')
  try {
    // What the database holds now. A database the migrations have not reached has no accounts table.
    const rows = (await handle.client`select email from accounts`.catch(() => {
      throw new Error('demo-seed: no accounts table. Run pnpm db:migrate against this database first.')
    })) as unknown as { email: string }[]
    const refusal = demoSeedRefusal({
      url,
      demoRef: process.env.DEMO_PROJECT_REF,
      refusedRefs: refusedRefs(),
      accountEmails: rows.map((row) => row.email),
      password,
      localPassword: E2E_PASSWORD,
    })
    if (refusal) {
      console.error(`demo-seed refuses to run: ${refusal}.`)
      process.exitCode = 1
      return
    }

    setRuntimeDb(handle)
    setBillingGateway(e2eBillingGateway())
    const now = new Date()
    await seedFixtures(handle.client, handle.db)
    await buildAgents(handle.db, password!, DEMO_AGENTS)
    await buildLiveData(handle.db, now)
    await checkAgents(handle.db, now, DEMO_AGENTS)
    console.log(`demo-seed ready: ${DEMO_AGENTS.filter((row) => row.login).length} demo agents can sign in.`)
  } finally {
    await handle.client.end({ timeout: 2 })
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
