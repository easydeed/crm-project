import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import {
  listMatchingFailuresForAdmin,
  listMatchingOverviewForAdmin,
} from '@/db/admin-matching'

test('admin matching queries require adminAccountId first', () => {
  expect(listMatchingOverviewForAdmin.length).toBe(1)
  expect(listMatchingFailuresForAdmin.length).toBe(2)
})

test('admin matching queries do not read the session or write contacts', () => {
  const src = readFileSync(new URL('./admin-matching.ts', import.meta.url), 'utf8')
  expect(src).not.toMatch(/cookies|readRequestSession|SESSION_COOKIE/)
  expect(src).not.toMatch(/\.update\(|\.insert\(|\.delete\(/)
  expect(src).not.toMatch(/assertWritable/)
  expect(src).not.toMatch(/matchSource: 'auto'|matchSource: 'review'|matchSource: 'corrected'/)
})

test('match_source is written on import, address edit, and review only', () => {
  const importer = readFileSync(new URL('../import/import-contacts.ts', import.meta.url), 'utf8')
  const edit = readFileSync(new URL('./contact-write.ts', import.meta.url), 'utf8')
  const review = readFileSync(new URL('./review-write.ts', import.meta.url), 'utf8')
  expect(importer).toContain("matchSource: 'auto'")
  expect(edit).toContain("matchSource: 'auto' as const")
  expect(review).toContain("'corrected'")
  expect(review).toContain("'review'")
})
