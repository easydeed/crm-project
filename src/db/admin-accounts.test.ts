import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { listAccountsForAdmin, recordViewAs } from '@/db/admin-accounts'

test('admin queries require adminAccountId on the function signature', () => {
  expect(listAccountsForAdmin.length).toBe(2)
  expect(recordViewAs.length).toBe(2)
})

test('admin queries do not read the session', () => {
  const src = readFileSync(new URL('./admin-accounts.ts', import.meta.url), 'utf8')
  expect(src).not.toMatch(/cookies|readRequestSession|SESSION_COOKIE/)
})
