import { spawnSync } from 'node:child_process'
import { expect, test } from 'vitest'

// The seed truncates every table. Run it against a host that is not this machine and it must stop
// before connecting, naming the host it saw.
test('the seed refuses any database that is not on this machine', () => {
  const run = spawnSync('pnpm', ['exec', 'tsx', 'scripts/seed.ts'], {
    encoding: 'utf8',
    env: { ...process.env, DATABASE_URL: 'postgres://postgres@db.example.com:5432/postgres' },
    timeout: 30_000,
  })
  expect(run.status).toBe(1)
  expect(run.stderr).toContain('seed refuses to run: DATABASE_URL points at db.example.com')
})
