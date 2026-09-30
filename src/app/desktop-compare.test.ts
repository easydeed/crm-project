import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

// The desktop pixel comparison runs on demand, not in CI, so this is what keeps it meaning something.
const spec = readFileSync(new URL('../../e2e/desktop-unchanged.spec.ts', import.meta.url), 'utf8')
const scripts: Record<string, string> = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
).scripts

test('the desktop comparison is exact: no per-pixel threshold, no allowed pixels', () => {
  expect(spec).toMatch(/threshold:\s*0,/)
  expect(spec).toMatch(/maxDiffPixels:\s*0,/)
})

test('a baseline rewrites every screen, and a comparison rewrites none', () => {
  expect(scripts['e2e:baseline']).toMatch(/--update-snapshots=all(\s|$)/)
  expect(scripts['e2e:compare']).toBeDefined()
  expect(scripts['e2e:compare']).not.toContain('--update-snapshots')
  for (const script of [scripts['e2e:baseline'], scripts['e2e:compare']]) {
    expect(script).toContain('PW_DESKTOP_COMPARE=1')
    expect(script).toContain('--project=desktop')
  }
})
