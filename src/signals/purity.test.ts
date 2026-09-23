import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const root = path.dirname(fileURLToPath(import.meta.url))

function sourceFiles(dir: string): string[] {
  const found: string[] = []
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === 'fixtures') continue
      found.push(...sourceFiles(full))
      continue
    }
    if (name.endsWith('.test.ts')) continue
    if (name.endsWith('.ts')) found.push(full)
  }
  return found
}

test('computeSignals does not import a clock, database, or network', () => {
  const forbidden = [
    /new Date\s*\(/,
    /Date\.now\s*\(/,
    /Date\.UTC\s*\(/,
    /Date\.parse\s*\(/,
    /\bfetch\s*\(/,
    /drizzle-orm/,
    /getRuntimeDb/,
    /from ['"]node:fs['"]/,
    /from ['"]postgres['"]/,
    /from ['"]@\/db\//,
    /from ['"]@\/jobs\//,
  ]
  const files = sourceFiles(root)
  expect(files.some((file) => file.endsWith(`${path.sep}compute.ts`))).toBe(true)
  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    for (const re of forbidden) {
      expect(src.search(re), `${path.relative(root, file)} ${re}`).toBe(-1)
    }
  }
})
