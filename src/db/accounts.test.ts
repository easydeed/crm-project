import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { countContactsForAccount, getAccountById } from '@/db/accounts'

test('tenant reads require accountId on the function signature', () => {
  expect(getAccountById.length).toBe(1)
  expect(countContactsForAccount.length).toBe(1)
})

test('account queries do not read the session', () => {
  const src = readFileSync(new URL('./accounts.ts', import.meta.url), 'utf8')
  expect(src).not.toMatch(/cookies|readRequestSession|SESSION_COOKIE/)
})
