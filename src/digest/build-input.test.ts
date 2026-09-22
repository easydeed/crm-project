import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { firstNameFrom } from '@/digest/build-input'

test('buildDigestInput takes db, accountId, contactId, and asOf', () => {
  const src = readFileSync(new URL('./build-input.ts', import.meta.url), 'utf8')
  expect(src).toContain(
    'export async function buildDigestInput(\n  db: DigestDb,\n  accountId: string,\n  contactId: string,\n  asOf: Date,',
  )
  expect(src).toContain('eq(contacts.accountId, accountId)')
  expect(src).toContain('streetNameNorm')
  expect(src).toContain('withinTrailingMonths')
  expect(src).not.toMatch(/Date\.now\s*\(/)
  expect(src).not.toMatch(/getRuntimeDb/)
})

test('firstNameFrom uses the first word', () => {
  expect(firstNameFrom('Marilyn Cole')).toBe('Marilyn')
  expect(firstNameFrom('  Maya  Chen ')).toBe('Maya')
})

test('renderer source stays free of a database', () => {
  const render = readFileSync(new URL('./render.ts', import.meta.url), 'utf8')
  expect(render).not.toMatch(/drizzle|getRuntimeDb|buildDigestInput|fetch\s*\(|Date\.now/)
})
