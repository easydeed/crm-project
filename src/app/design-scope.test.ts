import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function sourceFiles(dir: string, pattern = /\.(tsx?|css)$/): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return sourceFiles(full, pattern)
    return pattern.test(name) ? [full] : []
  })
}

const read = (file: string) => readFileSync(file, 'utf8')
const rel = (file: string) => path.relative(srcRoot, file)

/**
 * The only files that may name Archivo, the marketing page's display face (OR-053; Fraunces held this
 * place from OR-038). An allowlist over all of src, failing both ways: a new file is red, and a listed
 * file that no longer names it is red. The page's own files reach it through marketing/ui.ts, and
 * only they may import that.
 */
const ARCHIVO: Record<string, string> = {
  'app/fonts/fonts.ts': 'loads it',
  'app/fonts/OFL-archivo.txt': 'its licence',
  'app/globals.css': 'maps it to --font-display',
  'app/marketing/ui.ts': "the marketing page's display class, the only one",
}
const MARKETING = /^app\/(marketing\/|home-story\.tsx$|page\.tsx$|sample\/page\.tsx$)/

test('Archivo stays on the marketing page: only the listed files under src name it, and only marketing files import them', () => {
  const naming = sourceFiles(srcRoot, /./)
    .filter((file) => !/\.test\./.test(file) && /archivo|font-display/i.test(read(file)))
    .map(rel)
    .sort()
  expect(naming).toEqual(Object.keys(ARCHIVO).sort())
  const importers = sourceFiles(srcRoot, /\.tsx?$/)
    .filter((file) => !/\.test\./.test(file) && /from '@\/app\/marketing\//.test(read(file)))
    .map(rel)
  expect(importers.length).toBeGreaterThan(3)
  expect(importers.filter((file) => !MARKETING.test(file))).toEqual([])
})

test('the email keeps its own design: nothing in src/digest reads an app token', () => {
  const tokens = [...read(path.join(srcRoot, 'app/globals.css')).matchAll(/^\s*--([\w-]+):/gm)].map((m) => m[1]!)
  expect(tokens).toContain('coral-text')
  const offenders = sourceFiles(path.join(srcRoot, 'digest')).flatMap((file) => {
    const text = read(file)
    const hits = tokens.filter((token) => text.includes(`var(--${token})`))
    if (/globals\.css/.test(text)) hits.push('globals.css')
    return hits.map((hit) => `${rel(file)}: ${hit}`)
  })
  expect(offenders).toEqual([])
})

/**
 * A page can fetch from Google without next/font/google: a <link> or an @import of a Google Fonts URL
 * does it too, and until OR-053 nothing looked (OR-052 §5). Any mention of either host is red.
 */
const GOOGLE_FONTS = /fonts\.googleapis\.com|fonts\.gstatic\.com|from\s+['"]next\/font\/google['"]|import\(\s*['"]next\/font\/google['"]/

test('fonts are bundled: nothing imports next/font/google or links to Google Fonts, so no page fetches from Google', () => {
  const publicRoot = path.join(srcRoot, '..', 'public')
  const offenders = [...sourceFiles(srcRoot, /\.(tsx?|css|mjs|js|json|html|svg)$/), ...sourceFiles(publicRoot, /\.(css|js|html|svg)$/)]
    .filter((file) => !/\.test\./.test(file) && GOOGLE_FONTS.test(read(file)))
    .map(rel)
  expect(offenders).toEqual([])
  for (const spelling of [
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo" />',
    "@import url('https://fonts.googleapis.com/css2?family=Inter');",
    "src: url(https://fonts.gstatic.com/s/archivo/v25/a.woff2)",
    "import { Inter } from 'next/font/google'",
  ]) {
    expect(GOOGLE_FONTS.test(spelling), spelling).toBe(true)
  }
  expect(GOOGLE_FONTS.test("import localFont from 'next/font/local'")).toBe(false)
  expect(read(path.join(srcRoot, 'app/fonts/fonts.ts'))).toContain("from 'next/font/local'")
})

test('every bundled range is on a screen: the seed has a name in latin-ext and one in vietnamese', () => {
  const fonts = read(path.join(srcRoot, 'app/fonts/fonts.ts'))
  for (const range of ['latin', 'latin-ext', 'vietnamese']) {
    expect(fonts).toContain(`./inter-${range}.woff2`)
  }
  // Archivo is latin only: the marketing page's words are latin, and the stack falls to Inter.
  expect(fonts).toContain('./archivo-latin.woff2')
  const seed = read(path.join(srcRoot, 'db/fixtures/la-verne.ts'))
  const codePoints = [...seed].map((char) => char.codePointAt(0)!)
  expect(codePoints.some((cp) => cp >= 0x0100 && cp <= 0x02ba), 'a latin-ext name').toBe(true)
  expect(codePoints.some((cp) => cp >= 0x1ea0 && cp <= 0x1ef9), 'a vietnamese name').toBe(true)
})
