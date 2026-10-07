import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { buttonClass, destructiveButtonClass, linkBaseClass, secondaryButtonClass } from '@/app/app/people/ui'

/**
 * OR-034. Copies of buttonClass's string, across src/app outside /admin (unstyled by decision).
 * The list fails both ways: a copy not listed is new, and a listed copy that is gone must be
 * deleted from here. Each entry names who removes it.
 */
const LISTED: Record<string, string> = {}

// OR-042: read from ui.ts, never typed here. A literal copy of the old buttonClass stopped finding
// copies the moment buttonClass changed: it checked a frozen string, not the shared one.
const visible = (value: string) => value.slice(0, value.includes(' disabled:') ? value.indexOf(' disabled:') : undefined)
const PRIMARY = visible(buttonClass)
const OUTLINED = visible(secondaryButtonClass).replace(' text-foreground', '')
const LINK = linkBaseClass.replace('text-[15px] ', '')

/** Copies of linkClass's string (OR-037), the same way. Empty since OR-043 brought the banner in. */
const LINK_LISTED: Record<string, string> = {}
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
  const carrying = files.filter((file) => {
    const text = readFileSync(path.join(appRoot, file), 'utf8')
    return text.includes(PRIMARY) || text.includes(OUTLINED)
  })
  expect(OUTLINED).toContain('border-border')
  expect(destructiveButtonClass.startsWith(OUTLINED)).toBe(true)
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
