import { expect, test } from 'vitest'
import { noParcelKindFor } from '@/matching/no-parcel-kind'

test('non-addresses are not real streets', () => {
  expect(noParcelKindFor('no_parcel', 'PO Box 312, La Verne, CA 91750')).toBe(
    'non_address',
  )
  expect(noParcelKindFor('no_parcel', '')).toBe('non_address')
  expect(noParcelKindFor('no_parcel', 'La Verne')).toBe('non_address')
  expect(noParcelKindFor('no_parcel', 'dana@coastline.example')).toBe('non_address')
  expect(noParcelKindFor('no_parcel', '909-555-0100')).toBe('non_address')
  expect(noParcelKindFor('no_parcel', 'Anita Flores')).toBe('non_address')
})

test('a parsed street with no house is unmatched', () => {
  expect(
    noParcelKindFor('no_parcel', '9999 Unknown Ridge, Nowhere, CA 00000'),
  ).toBe('unmatched')
})

test('matched and needs_review have no kind', () => {
  expect(noParcelKindFor('matched', '1142 Oakdale Ave, La Verne, CA 91750')).toBeNull()
  expect(
    noParcelKindFor('needs_review', '1846 Oakdale Ave, La Verne, CA 91750'),
  ).toBeNull()
})
