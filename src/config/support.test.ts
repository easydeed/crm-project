import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { SUPPORT_EMAIL, pausedAccountMailto } from '@/config/support'

test('the paused-account link names the real address and the account in its subject', () => {
  expect(SUPPORT_EMAIL).toBe('help@onrecord.com')
  expect(pausedAccountMailto('3f2a-uuid')).toBe('mailto:help@onrecord.com?subject=Paused%20account%20-%203f2a-uuid')
})

test('the system-pause card links through the one constant, never a blank or inline mailto', () => {
  const card = readFileSync(new URL('../app/app/home-card.tsx', import.meta.url), 'utf8')
  expect(card).toContain('href={pausedAccountMailto(view.accountId)}')
  expect(card).not.toMatch(/mailto:/)
})
