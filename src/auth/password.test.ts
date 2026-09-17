import { expect, test } from 'vitest'
import {
  PASSWORD_REQUIREMENTS,
  hashPassword,
  passwordMeetsRequirements,
  verifyPassword,
  verifyPasswordOrDummy,
} from '@/auth/password'

test('password requirements are visible copy, not a post-failure rule', () => {
  expect(PASSWORD_REQUIREMENTS[0]).toMatch(/10 characters/)
  expect(passwordMeetsRequirements('short')).toBe(false)
  expect(passwordMeetsRequirements('long-enough-password')).toBe(true)
})

test('scrypt hashes can be verified and reject a wrong password', async () => {
  const hash = await hashPassword('long-enough-password')
  expect(hash.startsWith('scrypt$')).toBe(true)
  expect(await verifyPassword('long-enough-password', hash)).toBe(true)
  expect(await verifyPassword('different-password', hash)).toBe(false)
})

test('unknown users still run a hash so missing emails are not obvious', async () => {
  expect(await verifyPasswordOrDummy('long-enough-password', null)).toBe(false)
})
