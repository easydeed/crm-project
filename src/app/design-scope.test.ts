import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.(tsx?|css)$/.test(name) ? [full] : []
  })
}

const read = (file: string) => readFileSync(file, 'utf8')
const rel = (file: string) => path.relative(srcRoot, file)

test('Fraunces stays on the marketing page: nothing under /app or /admin names it', () => {
  const offenders = ['app/app', 'app/admin']
    .flatMap((dir) => sourceFiles(path.join(srcRoot, dir)))
    .filter((file) => /fraunces|font-serif/i.test(read(file)))
    .map(rel)
  expect(offenders).toEqual([])
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
