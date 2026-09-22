import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const FORBIDDEN = [
  'Dana Whitfield',
  'dana@coastline.example',
  '00000000-0000-4000-8000-000000000001',
  'loadDatabasePoolerUrl',
  'AGENT_ID',
  'buildLaVerneFixtures',
  'ensureLaVerneParcels',
]

function integrationFiles(dir: string): string[] {
  const found: string[] = []
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) {
      found.push(...integrationFiles(full))
      continue
    }
    if (name.endsWith('.integration.test.ts')) found.push(full)
  }
  return found
}

test('integration tests do not read seed rows or the transaction pooler', () => {
  const files = integrationFiles(srcRoot)
  expect(files.length).toBeGreaterThan(0)
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    for (const token of FORBIDDEN) {
      expect(src.includes(token), `${path.relative(srcRoot, file)} ${token}`).toBe(
        false,
      )
    }
  }
})
