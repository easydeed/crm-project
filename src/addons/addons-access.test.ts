import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const STATE = 'src/addons/state.ts'

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? files(full) : /\.(ts|tsx)$/.test(name) ? [full] : []
  })
}

const all = files(path.join(root, 'src')).map((file) => ({ rel: path.relative(root, file), src: readFileSync(file, 'utf8') }))
const production = all.filter(({ rel }) => !/\.test\.ts$/.test(rel))

/** Ways a file could read or write account_addons without going through state.ts. */
function addonTableAccess(rel: string, src: string): string[] {
  if (rel === STATE || /^src\/db\/schema[\w-]*\.ts$/.test(rel)) return []
  const found: string[] = []
  if (/\baccountAddons\b/.test(src)) found.push('names accountAddons')
  if (/\baccount_addons\b/.test(src)) found.push('names account_addons in SQL')
  return found
}

test('state.ts is the only door to account_addons, so isAddonEnabled is the only check', () => {
  const violations = production.flatMap(({ rel, src }) => addonTableAccess(rel, src).map((why) => `${rel}: ${why}`))
  expect(violations).toEqual([])
})

test('the door check catches a direct import and raw SQL', () => {
  expect(addonTableAccess('src/app/x.ts', "import { accountAddons } from '@/db/schema'")).toEqual(['names accountAddons'])
  expect(addonTableAccess('src/app/x.ts', 'await sql`select * from account_addons`')).toEqual(['names account_addons in SQL'])
  expect(addonTableAccess('src/app/x.ts', "import { isAddonEnabled } from '@/addons/state'")).toEqual([])
})

test('every add-on state function takes accountId as its required first parameter', () => {
  const state = readFileSync(path.join(root, STATE), 'utf8')
  const exported = [...state.matchAll(/export (?:async )?function (\w+)\(([^)]*)\)/g)]
  expect(exported.map((m) => m[1])).toEqual(['isAddonEnabled', 'loadAddonStates', 'switchAddonOn', 'switchAddonOff', 'forceEnableAddon'])
  for (const [, name, params] of exported) expect(params, name).toMatch(/^accountId: string(,|$)/)
})

test('the fixture add-ons are imported only by tests, never registered in production', () => {
  const importers = production.filter(({ src }) => /from '@\/addons\/fixtures'/.test(src)).map(({ rel }) => rel)
  expect(importers).toEqual([])
})
