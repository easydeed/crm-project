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
 * The only files that may name Fraunces (OR-038). An allowlist over all of src, failing both ways:
 * a new file is red, and a listed file that no longer names it is red. The four-directory check this
 * replaces passed font-serif on the shared preview panel, which renders inside /app.
 */
const FRAUNCES: Record<string, string> = {
  'app/fonts/fonts.ts': 'loads it',
  'app/fonts/OFL-fraunces.txt': 'its licence',
  'app/globals.css': 'maps it to --font-serif',
  'app/home-story.tsx': "the marketing page's <h1>, the one display moment",
}

test('Fraunces stays on the marketing page: only the listed files under src name it', () => {
  const naming = sourceFiles(srcRoot, /./)
    .filter((file) => !/\.test\./.test(file) && /fraunces|font-serif/i.test(read(file)))
    .map(rel)
    .sort()
  expect(naming).toEqual(Object.keys(FRAUNCES).sort())
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

test('fonts are bundled: nothing imports next/font/google, so no build fetches from Google', () => {
  const offenders = sourceFiles(srcRoot)
    .filter((file) => /from\s+['"]next\/font\/google['"]|import\(\s*['"]next\/font\/google['"]/.test(read(file)))
    .map(rel)
  expect(offenders).toEqual([])
  expect(read(path.join(srcRoot, 'app/fonts/fonts.ts'))).toContain("from 'next/font/local'")
})

test('every bundled range is on a screen: the seed has a name in latin-ext and one in vietnamese', () => {
  const fonts = read(path.join(srcRoot, 'app/fonts/fonts.ts'))
  for (const range of ['latin', 'latin-ext', 'vietnamese']) {
    expect(fonts).toContain(`./inter-${range}.woff2`)
    expect(fonts).toContain(`./fraunces-${range}.woff2`)
  }
  const seed = read(path.join(srcRoot, 'db/fixtures/la-verne.ts'))
  const codePoints = [...seed].map((char) => char.codePointAt(0)!)
  expect(codePoints.some((cp) => cp >= 0x0100 && cp <= 0x02ba), 'a latin-ext name').toBe(true)
  expect(codePoints.some((cp) => cp >= 0x1ea0 && cp <= 0x1ef9), 'a vietnamese name').toBe(true)
})
