import { expect, test } from 'vitest'
import { GRANT_DEED_KIND, pickRecordedOwners } from '@/db/recorded-owner'

test('recorded owner is the latest grant deed party', () => {
  const owners = pickRecordedOwners([
    {
      parcelId: 'a',
      kind: GRANT_DEED_KIND,
      party: 'James Whitaker',
      recordedAt: '2015-04-01',
      docNumber: '2015040101',
    },
    {
      parcelId: 'a',
      kind: GRANT_DEED_KIND,
      party: 'Anita Flores',
      recordedAt: '2023-01-15',
      docNumber: '2023011501',
    },
    {
      parcelId: 'a',
      kind: 'deed_of_trust',
      party: 'Some Lender',
      recordedAt: '2024-06-01',
      docNumber: '2024060101',
    },
    {
      parcelId: 'b',
      kind: GRANT_DEED_KIND,
      party: '   ',
      recordedAt: '2020-01-01',
      docNumber: '2020010101',
    },
  ])
  expect(owners.get('a')).toBe('Anita Flores')
  expect(owners.has('b')).toBe(false)
})

test('omits the line when there is no grant deed party', () => {
  expect(pickRecordedOwners([]).size).toBe(0)
  expect(
    pickRecordedOwners([
      {
        parcelId: 'a',
        kind: 'quitclaim',
        party: 'Someone Else',
        recordedAt: '2022-01-01',
        docNumber: '1',
      },
    ]).size,
  ).toBe(0)
})
