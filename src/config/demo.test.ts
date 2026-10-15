import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { CRM_PROD_REF } from '@/config/database-url'
import { DEMO_AGENTS, DEMO_EMAILS, demoSeedRefusal, isHostedDemo } from '@/config/demo'
import { E2E_AGENTS } from '@/db/fixtures/e2e-agents'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8')

const REF = 'abcdefghijklmnopqrst'
const URL_OK = `postgres://postgres.${REF}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`
const LOCAL = 'e2e-local-scratch-only'
const ok = { url: URL_OK as string | undefined, demoRef: REF as string | undefined, refusedRefs: [] as string[], accountEmails: [] as string[], password: 'a-demo-password-16+' as string | undefined, localPassword: LOCAL }

/**
 * OR-050. The hosted demo's seed truncates every table, so it has two locks: the URL must name the
 * demo project (and never crm or a refused one), and the database must hold nothing but demo
 * agents. The second is the one that protects crm-dev whatever its URL looks like.
 */
test('demo-seed runs on an empty database or one holding only demo agents, on the demo project', () => {
  expect(demoSeedRefusal(ok)).toBeNull()
  expect(demoSeedRefusal({ ...ok, accountEmails: [...DEMO_EMAILS] })).toBeNull()
  expect(demoSeedRefusal({ ...ok, accountEmails: ['DANA@coastline.example'] })).toBeNull()
})

test('demo-seed refuses by name: no demo ref, another project, the crm project, a refused project', () => {
  const cases: Array<[Partial<typeof ok>, RegExp]> = [
    [{ url: undefined }, /no database URL/],
    [{ demoRef: undefined }, /not a Supabase project ref/],
    [{ demoRef: 'short' }, /not a Supabase project ref/],
    [{ url: URL_OK.replace(REF, 'zyxwvutsrqponmlkjihg') }, /does not point at DEMO_PROJECT_REF/],
    [{ url: `${URL_OK}?x=${CRM_PROD_REF}` }, /crm project/],
    [{ demoRef: CRM_PROD_REF, url: URL_OK.replace(REF, CRM_PROD_REF) }, /crm project/],
    [{ refusedRefs: [REF] }, /refused project/],
    [{ refusedRefs: ['qqqqqqqqqqqqqqqqqqqq'], url: `${URL_OK}?y=qqqqqqqqqqqqqqqqqqqq` }, /refused project/],
  ]
  for (const [change, why] of cases) expect(demoSeedRefusal({ ...ok, ...change }), JSON.stringify(change)).toMatch(why)
})

test('demo-seed refuses by content: any account that is not a demo agent, the admin included', () => {
  expect(demoSeedRefusal({ ...ok, accountEmails: ['dana@coastline.example', 'agent@realbrokerage.com'] })).toMatch(/not demo agents/)
  const admin = E2E_AGENTS.find((row) => row.role === 'admin')!
  expect(demoSeedRefusal({ ...ok, accountEmails: [admin.email] })).toMatch(/not demo agents/)
})

test('demo-seed refuses a missing, short or published password', () => {
  expect(demoSeedRefusal({ ...ok, password: undefined })).toMatch(/not set/)
  expect(demoSeedRefusal({ ...ok, password: 'fifteen-chars!!' })).toMatch(/shorter than 16/)
  expect(demoSeedRefusal({ ...ok, password: LOCAL })).toMatch(/local e2e password/)
  expect(read('scripts/e2e-password.ts')).toContain(`'${LOCAL}'`)
})

test('the hosted demo has no admin: /admin and view-as stay local', () => {
  expect(DEMO_AGENTS.length).toBe(E2E_AGENTS.length - 1)
  expect(DEMO_AGENTS.some((row) => row.role === 'admin')).toBe(false)
  expect(DEMO_EMAILS.has('dana@coastline.example')).toBe(true)
})

test('the billing stand-in runs hosted only with ONRECORD_DEMO on the demo project, never crm', () => {
  const pooler = `postgres://postgres.${REF}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`
  const env = { ONRECORD_DEMO: '1', DEMO_PROJECT_REF: REF, DATABASE_POOLER_URL: pooler }
  expect(isHostedDemo(env)).toBe(true)
  expect(isHostedDemo({ ...env, ONRECORD_DEMO: undefined })).toBe(false)
  expect(isHostedDemo({ ...env, ONRECORD_DEMO: 'true' })).toBe(false)
  expect(isHostedDemo({ ...env, DEMO_PROJECT_REF: undefined })).toBe(false)
  expect(isHostedDemo({ ...env, DATABASE_POOLER_URL: pooler.replace(REF, CRM_PROD_REF), DEMO_PROJECT_REF: CRM_PROD_REF })).toBe(false)
  expect(isHostedDemo({ ...env, DATABASE_POOLER_URL: pooler.replace(REF, 'zyxwvutsrqponmlkjihg') })).toBe(false)
  expect(isHostedDemo({ ...env, DEMO_REFUSED_REFS: REF })).toBe(false)
  expect(read('src/billing/current.ts')).toMatch(/isLocalE2E\(\) \|\| isHostedDemo\(\) \? e2eBillingGateway\(\) : new StripeGateway\(\)/)
})

/**
 * The local-only guard stays exactly as it was (Director, OR-050): seed and e2e-setup refuse any
 * database not on this machine, and neither knows the demo door exists. The bodies they share with
 * demo-seed check nothing, so only the three guarded entry points may import them.
 */
test('seed and e2e-setup keep their local-only guard; the shared seed bodies have exactly three callers', () => {
  for (const file of ['scripts/seed.ts', 'scripts/e2e-setup.ts']) {
    const text = read(file)
    expect(text, file).toMatch(/if \(!isLocalDatabaseUrl\([^)]*\)\) \{[\s\S]{0,400}process\.exit\(1\)/)
    expect(text, file).not.toMatch(/config\/demo|demoSeedRefusal|demo-seed/)
  }
  const demo = read('scripts/demo-seed.ts')
  expect(demo.indexOf('demoSeedRefusal(')).toBeGreaterThan(0)
  expect(demo.indexOf('demoSeedRefusal(')).toBeLessThan(demo.indexOf('seedFixtures(handle'))
  const files = (dir: string): string[] =>
    readdirSync(path.join(root, dir)).flatMap((name) => {
      const rel = path.join(dir, name)
      if (statSync(path.join(root, rel)).isDirectory()) return name === 'node_modules' ? [] : files(rel)
      return /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [rel] : []
    })
  const importers = (module: string) => [...files('scripts'), ...files('src'), ...files('e2e')].filter((file) => new RegExp(`from '\\./${module}'|${module}'\\)`).test(read(file))).sort()
  expect(importers('seed-core')).toEqual(['scripts/demo-seed.ts', 'scripts/seed.ts'])
  expect(importers('live-data')).toEqual(['scripts/demo-seed.ts', 'scripts/e2e-setup.ts'])
})
