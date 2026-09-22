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
    if (name === 'build-input.ts') continue
    if (name.endsWith('.test.ts') || name.endsWith('.test.tsx')) continue
    if (/\.(ts|tsx)$/.test(name)) found.push(full)
  }
  return found
}

test('digest renderer does not import a clock, database, or network', () => {
  const forbidden = [
    /Date\.now\s*\(/,
    /\bfetch\s*\(/,
    /drizzle-orm/,
    /getRuntimeDb/,
    /from ['"]node:fs['"]/,
    /from ['"]postgres['"]/,
    /from ['"]date-fns/,
  ]
  for (const file of sourceFiles(root)) {
    const src = readFileSync(file, 'utf8')
    for (const re of forbidden) {
      expect(src.search(re), `${path.relative(root, file)} ${re}`).toBe(-1)
    }
  }
})
