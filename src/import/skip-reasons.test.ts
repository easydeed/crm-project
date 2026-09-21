import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { SKIP } from '@/import/skip-reasons'

test('skip reasons are the exact product strings', () => {
  expect(SKIP.noEmail).toBe("No email — we can't send without one")
  expect(SKIP.alreadyInList).toBe('Already in your list')
  expect(SKIP.missingAddress).toBe('Missing an address')
  expect(SKIP.overLimit).toBe('Over your 250-person limit')
})

test('result screen has the required links and counts', () => {
  const src = readFileSync(new URL('../app/app/people/import/import-result.tsx', import.meta.url), 'utf8')
  expect(src).toContain('on the map')
  expect(src).toContain('need a look')
  expect(src).toContain('have no house on the record')
  expect(src).toContain('See why')
  expect(src).toContain('Review them')
  expect(src).toContain('href="/app/people?status=needs_review"')
  expect(src).toContain('Go to your people')
})
