import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import {
  updateAccountAppearance,
  updateAccountDetails,
  updateAccountSending,
} from '@/db/account-settings'
import { countContactsForAccount, getAccountById } from '@/db/accounts'

test('tenant reads and settings writes require accountId on the function signature', () => {
  expect(getAccountById.length).toBe(1)
  expect(countContactsForAccount.length).toBe(1)
  expect(updateAccountDetails.length).toBe(2)
  expect(updateAccountAppearance.length).toBe(2)
  expect(updateAccountSending.length).toBe(2)
})

test('account queries do not read the session', () => {
  const files = ['accounts.ts', 'account-settings.ts']
  for (const name of files) {
    const src = readFileSync(new URL(`./${name}`, import.meta.url), 'utf8')
    expect(src).not.toMatch(/cookies|readRequestSession|SESSION_COOKIE/)
  }
})
