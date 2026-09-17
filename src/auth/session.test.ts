import { expect, test } from 'vitest'
import {
  createSessionValue,
  readSessionValue,
  safeReturnTo,
} from '@/auth/session'

process.env.SESSION_SECRET ??= 'test-session-secret-that-is-32-chars-min'

test('signed session round-trips accountId and role', () => {
  const value = createSessionValue('account-1', 'agent')
  expect(readSessionValue(value)).toMatchObject({
    accountId: 'account-1',
    role: 'agent',
  })
})

test('tampered session values are rejected', () => {
  const value = createSessionValue('account-1', 'agent')
  expect(readSessionValue(`${value}x`)).toBeNull()
  expect(readSessionValue('not-a-session')).toBeNull()
})

test('returnTo only allows same-origin relative paths', () => {
  expect(safeReturnTo('/app')).toBe('/app')
  expect(safeReturnTo('https://evil.example')).toBe('/app')
  expect(safeReturnTo('//evil.example')).toBe('/app')
  expect(safeReturnTo(null)).toBe('/app')
})
