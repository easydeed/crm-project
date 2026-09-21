import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { findCandidateParcels } from '@/matching/candidates'

test('findCandidateParcels takes db and normalized address only', () => {
  expect(findCandidateParcels.length).toBe(2)
  const src = readFileSync(new URL('./candidates.ts', import.meta.url), 'utf8')
  expect(src).not.toMatch(/accountId/)
})
