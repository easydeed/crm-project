import { expect, test } from 'vitest'
import { safeReturnTo } from '@/auth/session'

test.each([
  '/\\evil.com', '//evil.com', 'https://evil.com', 'http://evil.com',
  '/%5cevil.com', '/%2fevil.com', '/\tevil.com', '/\nevil.com', '/\revil.com',
  ' /app', '/%00evil.com', '/%09/evil.com', 'javascript:alert(1)', '/%zz',
])('OR-056 rejects off-site or ambiguous login return target %j', (target) => {
  expect(safeReturnTo(target)).toBe('/app')
})

test.each(['/app', '/app/people?search=Marilyn', '/app/settings#phone', '/sample'])('OR-056 preserves local target %j', (target) => {
  expect(safeReturnTo(target)).toBe(target)
  expect(new URL(safeReturnTo(target), 'https://onrecord.invalid').origin).toBe('https://onrecord.invalid')
})
