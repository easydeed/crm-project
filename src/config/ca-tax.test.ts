import { expect, test } from 'vitest'
import { CA_TAX } from '@/config/ca-tax'

test('CA_TAX pins the five in-scope counties', () => {
  expect([...CA_TAX.counties]).toEqual([
    'Los Angeles',
    'Orange',
    'San Bernardino',
    'Riverside',
    'San Diego',
  ])
})

test('CA_TAX has an effective date and review-by date', () => {
  expect(CA_TAX.effectiveDate).toBe('2026-07-01')
  expect(CA_TAX.reviewBy).toBe('2027-07-01')
})
