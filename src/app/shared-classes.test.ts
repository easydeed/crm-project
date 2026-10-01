import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

/**
 * OR-034. Copies of buttonClass's string, across src/app outside /admin (unstyled by decision).
 * The list fails both ways: a copy not listed is new, and a listed copy that is gone must be
 * deleted from here. Each entry names who removes it.
 */
const LISTED: Record<string, string> = {
  'app/home-card.tsx': 'final sweep: a <Link> styled as a button on the dashboard',
  'app/home-billing-card.tsx': 'final sweep: a <Link> styled as a button on the dashboard',
  'home-story.tsx': 'final sweep: the marketing page',
}

const PRIMARY = 'rounded-md bg-foreground px-4 py-2 text-[15px] text-background'
const appRoot = path.dirname(fileURLToPath(import.meta.url))

function sourceFiles(dir = ''): string[] {
  return readdirSync(path.join(appRoot, dir)).flatMap((name) => {
    const rel = path.join(dir, name)
    if (statSync(path.join(appRoot, rel)).isDirectory()) return rel === 'admin' ? [] : sourceFiles(rel)
    return /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [rel] : []
  })
}

test('buttonClass is defined once; the only copies of its string are the listed ones', () => {
  const files = sourceFiles()
  expect(files.length).toBeGreaterThan(100)
  const carrying = files.filter((file) => readFileSync(path.join(appRoot, file), 'utf8').includes(PRIMARY))
  expect(carrying).toContain('app/people/ui.ts')
  const copies = carrying.filter((file) => file !== 'app/people/ui.ts').sort()
  expect(copies).toEqual(Object.keys(LISTED).sort())
})
