import { expect, test } from 'vitest'
import {
  buildLaVerneFixtures,
  oakdaleSales,
  unmatchedContacts,
} from '@/db/fixtures/la-verne'

test('La Verne fixture has Dana Whitfield and 47 contacts', () => {
  const fixture = buildLaVerneFixtures()
  expect(fixture.agent.name).toBe('Dana Whitfield')
  expect(fixture.agent.brokerage).toBe('Coastline Realty')
  expect(fixture.agent.dre).toBe('01998432')
  expect(fixture.contacts).toHaveLength(47)
})

test('three contacts are unmatched and one is a PO Box', () => {
  const unmatched = unmatchedContacts
  expect(unmatched).toHaveLength(3)
  expect(unmatched.filter((c) => c.status === 'no_parcel')).toHaveLength(1)
  expect(unmatched.some((c) => c.addressRaw.startsWith('PO Box'))).toBe(true)
})

test('three Oakdale Ave recorded sales are present', () => {
  const fixture = buildLaVerneFixtures()
  expect(oakdaleSales).toHaveLength(3)
  const oakdaleEvents = fixture.parcelEvents.filter((event) =>
    oakdaleSales.some((sale) => sale.docNumber === event.docNumber),
  )
  expect(oakdaleEvents).toHaveLength(3)
  expect(
    fixture.parcels.filter((parcel) => parcel.address.endsWith('Oakdale Ave')),
  ).toHaveLength(3)
})
