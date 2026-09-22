import { expect, test } from 'vitest'
import {
  exportHasIdentity,
  failureToFixture,
  fixturesToJson,
} from '@/admin/matching-export'

const rows = [
  {
    addressRaw: '1846 Oakdale Ave, La Verne, CA 91750',
    status: 'needs_review' as const,
    matchSource: 'auto' as const,
    parcelApn: null,
    howResolved: 'Still needs a look',
  },
  {
    addressRaw: '9999 Unknown Ridge, Nowhere, CA 00000',
    status: 'no_parcel' as const,
    matchSource: 'auto' as const,
    parcelApn: null,
    howResolved: 'No house found',
  },
  {
    addressRaw: '410 Reviewoak Ave, La Verne, CA 91991',
    status: 'matched' as const,
    matchSource: 'corrected' as const,
    parcelApn: 'OR008-FIX',
    howResolved: 'Wrong house?',
  },
]

test('export is fixture-shaped and drops names and emails', () => {
  const payload = fixturesToJson(rows)
  const parsed = JSON.parse(payload) as unknown
  expect(parsed).toEqual([
    {
      raw: '1846 Oakdale Ave, La Verne, CA 91750',
      expect: 'needs_review',
      note: 'Still needs a look',
    },
    {
      raw: '9999 Unknown Ridge, Nowhere, CA 00000',
      expect: 'no_parcel',
      note: 'No house found',
    },
    {
      raw: '410 Reviewoak Ave, La Verne, CA 91991',
      expect: 'matched',
      expectApn: 'OR008-FIX',
      note: 'Wrong house?',
    },
  ])
  expect(exportHasIdentity(payload, ['Anita Flores', 'anita@example.com'])).toBe(false)
  expect(failureToFixture(rows[2]).expectApn).toBe('OR008-FIX')
})
