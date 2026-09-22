import { expect, test } from 'vitest'
import {
  compareAccountRates,
  formatRate,
  matchingRates,
  type RateRow,
} from '@/admin/matching-rates'

const mix: RateRow[] = [
  { status: 'matched', matchSource: 'auto', noParcelKind: null },
  { status: 'matched', matchSource: 'review', noParcelKind: null },
  { status: 'matched', matchSource: 'corrected', noParcelKind: null },
  { status: 'needs_review', matchSource: 'auto', noParcelKind: null },
  { status: 'no_parcel', matchSource: 'auto', noParcelKind: 'unmatched' },
  { status: 'no_parcel', matchSource: 'auto', noParcelKind: 'non_address' },
]

test('rates exclude non-addresses from both denominators', () => {
  const rates = matchingRates(mix)
  expect(rates.street).toBe(5)
  expect(rates.autoMatched).toBe(1)
  expect(rates.matched).toBe(3)
  expect(rates.autoMatchRate).toBe(1 / 5)
  expect(rates.finalCoverage).toBe(3 / 5)
})

test('a classified PO Box is not a street in the gate metric', () => {
  const rates = matchingRates([
    { status: 'matched', matchSource: 'auto', noParcelKind: null },
    { status: 'no_parcel', matchSource: 'auto', noParcelKind: 'non_address' },
  ])
  expect(rates.street).toBe(1)
  expect(rates.autoMatched).toBe(1)
  expect(rates.autoMatchRate).toBe(1)
})

test('per-account sort is lowest auto-match first', () => {
  const homework = matchingRates(mix)
  const clean = matchingRates([
    { status: 'matched', matchSource: 'auto', noParcelKind: null },
    { status: 'matched', matchSource: 'auto', noParcelKind: null },
    { status: 'no_parcel', matchSource: 'auto', noParcelKind: 'non_address' },
  ])
  expect(compareAccountRates(homework, clean)).toBeLessThan(0)
  expect(formatRate(homework.autoMatchRate, homework.autoMatched, homework.street)).toBe(
    '20% · 1 of 5',
  )
})
