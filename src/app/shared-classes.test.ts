import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

/**
 * OR-034. Copies of buttonClass's string, across src/app outside /admin (unstyled by decision).
 * The list fails both ways: a copy not listed is new, and a listed copy that is gone must be
 * deleted from here. Each entry names who removes it.
 */
const LISTED: Record<string, string> = {}

const PRIMARY = 'rounded-md bg-foreground px-4 py-2 text-[15px] text-background'
const LINK = 'underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

/** Copies of linkClass's string (OR-037), the same way. The banner is exempt from the visual system. */
const LINK_LISTED: Record<string, string> = {
  'app/view-as-banner.tsx': 'exempt: white on INK_COLOR, deliberately outside the visual system',
}
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

test('linkClass is defined once; the only copies of its string are the listed ones', () => {
  const carrying = sourceFiles().filter((file) => readFileSync(path.join(appRoot, file), 'utf8').includes(LINK))
  expect(carrying).toContain('app/people/ui.ts')
  const copies = carrying.filter((file) => file !== 'app/people/ui.ts').sort()
  expect(copies).toEqual(Object.keys(LINK_LISTED).sort())
})
