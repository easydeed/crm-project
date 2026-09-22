import { expect, test } from 'vitest'
import { AS_OF } from '@/digest/fixtures/scenarios'
import {
  ownedForPhrase,
  roundToHundred,
  streetLabel,
  withinTrailingMonths,
} from '@/digest/format'

test('ownership from asOf is seven years and five months', () => {
  expect(ownedForPhrase('2019-04-15', AS_OF)).toBe(
    "You've owned it seven years and five months.",
  )
})

test('street label drops the house number and suffix', () => {
  expect(streetLabel('1142 Oakdale Ave')).toBe('Oakdale')
  expect(streetLabel('1142 Oakdale Ave Unit 4')).toBe('Oakdale')
})

test('trailing twelve months uses asOf, not a clock', () => {
  expect(withinTrailingMonths('2025-09-16', AS_OF, 12)).toBe(true)
  expect(withinTrailingMonths('2025-09-14', AS_OF, 12)).toBe(false)
})

test('benefit rounds to the nearest hundred', () => {
  expect(roundToHundred(7072.5)).toBe(7100)
})
