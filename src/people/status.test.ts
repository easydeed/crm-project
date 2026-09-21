import { expect, test } from 'vitest'
import {
  CONTACT_STATUS_LABELS,
  contactStatusLabel,
  STATUS_FILTERS,
} from '@/people/status'

test('status copy is the exact People-page wording', () => {
  expect(contactStatusLabel('matched')).toBe('On the map')
  expect(contactStatusLabel('needs_review')).toBe('Needs a look')
  expect(contactStatusLabel('no_parcel')).toBe("Couldn't find")
  expect(CONTACT_STATUS_LABELS).toEqual({
    matched: 'On the map',
    needs_review: 'Needs a look',
    no_parcel: "Couldn't find",
  })
})

test('status filters are All and the three labels', () => {
  expect(STATUS_FILTERS.map((item) => item.label)).toEqual([
    'All',
    'On the map',
    'Needs a look',
    "Couldn't find",
  ])
})
