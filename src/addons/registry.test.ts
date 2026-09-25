import { z } from 'zod'
import { expect, test } from 'vitest'
import { FIXTURE_CONFIG, FIXTURE_PLAIN, FIXTURE_PRICES, fixtureRegistry } from '@/addons/fixtures'
import { createRegistry, getAddonRegistry } from '@/addons/registry'
import type { AddonDefinition } from '@/addons/types'

test('registering the same key twice fails at startup', () => {
  expect(() => createRegistry([FIXTURE_PLAIN, { ...FIXTURE_PLAIN, title: 'Again' }], FIXTURE_PRICES)).toThrow(/fixture_plain is registered twice/)
})

test('production registers no add-on yet', () => {
  expect(getAddonRegistry().list()).toEqual([])
})

test('a price comes only from ADDON_PRICES; an add-on without one cannot register', () => {
  expect(() => createRegistry([FIXTURE_PLAIN], {})).toThrow(/no price in ADDON_PRICES/)
  expect(fixtureRegistry().get('fixture_plain')?.priceCents).toBe(200)
})

test('a config form that cannot be built fails at registration, not at render', () => {
  const withSchema = (shape: z.ZodRawShape): AddonDefinition => ({ ...FIXTURE_CONFIG, key: 'bad', configSchema: z.object(shape) })
  const prices = { bad: 0 }
  expect(() => createRegistry([withSchema({ when: z.date().describe('When') })], prices)).toThrow(/must be a string, number, boolean, or enum/)
  expect(() => createRegistry([withSchema({ name: z.string() })], prices)).toThrow(/needs \.describe/)
  expect(() => createRegistry([{ ...FIXTURE_CONFIG, key: 'bad', configSchema: undefined }], prices)).toThrow(/requires config but has no configSchema/)
  const ok = createRegistry([withSchema({ a: z.string().describe('A'), b: z.number().optional().describe('B'), c: z.boolean().describe('C'), d: z.enum(['x', 'y']).describe('D') })], prices)
  expect(ok.get('bad')?.fields).toEqual([
    { name: 'a', label: 'A', kind: 'text', optional: false },
    { name: 'b', label: 'B', kind: 'number', optional: true },
    { name: 'c', label: 'C', kind: 'boolean', optional: false },
    { name: 'd', label: 'D', kind: 'enum', options: ['x', 'y'], optional: false },
  ])
})
