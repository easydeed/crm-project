import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

// The demo seeder's workflow (OR-050) holds to verify.yml's rules, and runs only by hand: a push
// never writes to the demo database, and it never reads the dev database's secret.
const workflow = readFileSync('.github/workflows/demo-seed.yml', 'utf8')

test('the demo seed runs only by hand', () => {
  const triggers = workflow.slice(workflow.indexOf('\non:'), workflow.indexOf('\nconcurrency:'))
  expect(triggers.trim()).toBe('on:\n  workflow_dispatch:')
})

test('the demo seed fails on any failing command', () => {
  expect(workflow).toContain('shell: bash -euo pipefail {0}')
  expect(workflow).not.toMatch(/continue-on-error|\|\|\s*true|set \+e/)
})

test('the demo seed reads the demo secrets and never DATABASE_URL', () => {
  expect(workflow).toContain('PREVIEW_DATABASE_URL: ${{ secrets.PREVIEW_DATABASE_URL }}')
  expect(workflow).toContain('DEMO_AGENT_PASSWORD: ${{ secrets.DEMO_AGENT_PASSWORD }}')
  expect(workflow).not.toMatch(/secrets\.DATABASE_URL\b|^\s*DATABASE_URL:/m)
  expect(workflow).toContain('run: pnpm demo:seed')
})
