import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { findCandidateParcels } from '@/matching/candidates'
import { parseAddress, streetNameNorm } from '@/matching/normalize'

test('findCandidateParcels takes db and normalized address only', () => {
  expect(findCandidateParcels.length).toBe(2)
  const src = readFileSync(new URL('./candidates.ts', import.meta.url), 'utf8')
  expect(src).not.toMatch(/accountId/)
})

test('findCandidateParcels always filters by street_name_norm', () => {
  const src = readFileSync(new URL('./candidates.ts', import.meta.url), 'utf8')
  expect(src).toMatch(/streetNameNorm/)
  expect(src).toMatch(/similarity/)
  expect(src).not.toMatch(/where\(\s*eq\(parcels\.zip/)
})

test('streetNameNorm reuses parseAddress name rules', () => {
  const raw = '1840 N Oakdale Avenue, La Verne, CA 91750'
  expect(streetNameNorm(raw)).toBe(parseAddress(raw)?.name)
  expect(streetNameNorm('1840 Oakdale Ave')).toBe('oakdale')
})
