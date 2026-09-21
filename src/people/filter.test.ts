import { expect, test } from 'vitest'
import { contactMatchesSearch, countByStatus, filterPeople } from '@/people/filter'
import type { ContactMatchStatus } from '@/people/status'

function row(
  index: number,
  extra?: Partial<{
    name: string
    email: string
    addressRaw: string
    status: ContactMatchStatus
    groupIds: string[]
  }>,
) {
  return {
    name: extra?.name ?? `Person ${String(index).padStart(3, '0')}`,
    email: extra?.email ?? `person-${index}@example.com`,
    addressRaw: extra?.addressRaw ?? `${100 + index} Main St, La Verne, CA 91750`,
    status: extra?.status ?? 'matched',
    groupIds: extra?.groupIds ?? [],
  }
}

test('search matches name, email, or address', () => {
  const person = row(1, {
    name: 'Maya Chen',
    email: 'maya.chen@example.com',
    addressRaw: '1840 Oakdale Ave, La Verne, CA 91750',
  })
  expect(contactMatchesSearch(person, 'maya')).toBe(true)
  expect(contactMatchesSearch(person, 'MAYA.CHEN@')).toBe(true)
  expect(contactMatchesSearch(person, 'oakdale')).toBe(true)
  expect(contactMatchesSearch(person, 'nope')).toBe(false)
})

test('search finds the last of 250 loaded contacts', () => {
  const rows = Array.from({ length: 250 }, (_, index) =>
    row(index, {
      name: index === 249 ? 'Zebra Lastperson' : `Person ${index}`,
      email: index === 249 ? 'zebra.last@example.com' : `person-${index}@example.com`,
      addressRaw:
        index === 249
          ? '999 Hidden End, La Verne, CA 91750'
          : `${100 + index} Main St, La Verne, CA 91750`,
    }),
  )
  expect(rows).toHaveLength(250)
  expect(filterPeople(rows, { q: 'Zebra Lastperson' })).toEqual([rows[249]])
  expect(filterPeople(rows, { q: 'zebra.last@' })).toEqual([rows[249]])
  expect(filterPeople(rows, { q: '999 Hidden End' })).toEqual([rows[249]])
})

test('status and group filters combine', () => {
  const rows = [
    row(1, { status: 'matched', groupIds: ['buyers'] }),
    row(2, { status: 'needs_review', groupIds: ['buyers'] }),
    row(3, { status: 'matched', groupIds: ['past'] }),
  ]
  expect(filterPeople(rows, { status: 'matched', groupId: 'buyers' })).toEqual([rows[0]])
  expect(countByStatus(rows.filter((item) => item.groupIds.includes('buyers')))).toEqual({
    all: 2,
    matched: 1,
    needs_review: 1,
    no_parcel: 0,
  })
})
