import { expect, test } from 'vitest'
import { normalizeUsPhone, parseOptionalUsPhone } from '@/config/phone'

test('normalizes common US phone formats to 10 digits', () => {
  expect(normalizeUsPhone('(909) 555-0147')).toBe('9095550147')
  expect(normalizeUsPhone('909-555-0147')).toBe('9095550147')
  expect(normalizeUsPhone('1 909 555 0147')).toBe('9095550147')
  expect(normalizeUsPhone('+1-909-555-0147')).toBe('9095550147')
})

test('rejects incomplete or non-US numbers', () => {
  expect(normalizeUsPhone('555-0147')).toBeNull()
  expect(parseOptionalUsPhone('')).toEqual({ ok: true, phone: null })
  expect(parseOptionalUsPhone('not-a-phone').ok).toBe(false)
})
