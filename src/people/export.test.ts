import { expect, test } from 'vitest'
import { contactsToCsv, EXPORT_COLUMNS, peopleExportFilename } from '@/people/export'

test('export filename includes the date', () => {
  expect(peopleExportFilename(new Date('2026-09-21T15:00:00'))).toBe('people-2026-09-21.csv')
})

test('export includes every detail column, including phone', () => {
  expect([...EXPORT_COLUMNS]).toEqual([
    'Name',
    'Email',
    'Phone',
    'Address',
    'Close date',
    'Notes',
    'Status',
    'Groups',
    'Parcel address',
    'APN',
  ])
  const csv = contactsToCsv([
    {
      name: 'Maya Chen',
      email: 'maya@example.com',
      phone: '9095550147',
      addressRaw: '1840 Oakdale Ave, La Verne, CA 91750',
      closeDate: '2020-06-15',
      notes: 'Past client',
      status: 'matched',
      groupNames: ['Buyers'],
      parcelAddress: '1840 Oakdale Ave, La Verne, 91750',
      parcelApn: '8377-016-019',
    },
  ])
  expect(csv.startsWith(EXPORT_COLUMNS.join(','))).toBe(true)
  expect(csv).toContain('Maya Chen')
  expect(csv).toContain('maya@example.com')
  expect(csv).toContain('909-555-0147')
  expect(csv).toContain('1840 Oakdale Ave, La Verne, CA 91750')
  expect(csv).toContain('2020-06-15')
  expect(csv).toContain('Past client')
  expect(csv).toContain('On the map')
  expect(csv).toContain('Buyers')
  expect(csv).toContain('8377-016-019')
})
