import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

const read = (file: string) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8')

test('schema reaches a database only through committed migrations', () => {
  const scripts = JSON.parse(read('package.json')).scripts as Record<string, string>
  const workflow = read('.github/workflows/verify.yml')
  expect(Object.keys(scripts)).not.toContain('db:push')
  expect(Object.values(scripts).join('\n')).not.toMatch(/drizzle-kit push/)
  expect(workflow).not.toMatch(/db:push|drizzle-kit push/)
  expect(scripts['db:migrate']).toBe('tsx scripts/migrate.ts')
  expect(workflow).not.toMatch(/MIGRATE_BASELINE:\s*['"]?1/)
  const journal = JSON.parse(read('drizzle/meta/_journal.json')) as { entries: { tag: string }[] }
  expect(journal.entries[0]?.tag).toBe('0000_initial')
})

test('CI fails a step on any non-zero exit, including inside a pipe', () => {
  const workflow = read('.github/workflows/verify.yml')
  expect(workflow).toContain('shell: bash -euo pipefail {0}')
  expect(workflow).not.toMatch(/continue-on-error|\|\|\s*true|set \+e/)
})

test('verify:fast runs unit tests only; verify runs everything', () => {
  const scripts = JSON.parse(read('package.json')).scripts as Record<string, string>
  expect(scripts['verify:fast']).toContain('vitest run --project unit')
  expect(scripts['verify:fast']).not.toContain('build')
  expect(scripts.verify).toContain('pnpm build')
  expect(scripts.verify).toContain('pnpm test')
})
