import { expect, test } from 'vitest'
import {
  contactLastName,
  formatHouseFacts,
  isInReviewQueue,
  isLeftOut,
  nameMatchesOwner,
  reviewHeader,
  reviewLeftOutDone,
} from '@/people/review-state'

test('queue is needs_review or pending no_parcel', () => {
  expect(isInReviewQueue('needs_review', 'pending')).toBe(true)
  expect(isInReviewQueue('needs_review', 'reviewed')).toBe(true)
  expect(isInReviewQueue('no_parcel', 'pending')).toBe(true)
  expect(isInReviewQueue('no_parcel', 'reviewed')).toBe(false)
  expect(isInReviewQueue('matched', 'pending')).toBe(false)
})

test('left out is reviewed no_parcel only', () => {
  expect(isLeftOut('no_parcel', 'reviewed')).toBe(true)
  expect(isLeftOut('no_parcel', 'pending')).toBe(false)
  expect(isLeftOut('matched', 'reviewed')).toBe(false)
})

test('header is accurate N of M', () => {
  expect(reviewHeader(3, 7)).toBe('Needs a look · 3 of 7')
  expect(reviewHeader(1, 1)).toBe('Needs a look · 1 of 1')
})

test('name matches uses last name and accent-fold', () => {
  expect(contactLastName('Anita Flores')).toBe('Flores')
  expect(nameMatchesOwner('Anita Flores', 'Anita Flores')).toBe(true)
  expect(nameMatchesOwner('Anita Flores', 'FLORES, ANITA')).toBe(true)
  expect(nameMatchesOwner('José Núñez', 'JOSE NUNEZ')).toBe(true)
  expect(nameMatchesOwner('Anita Flores', 'Robert Chen')).toBe(false)
  expect(nameMatchesOwner('Mei Lin', 'Linda Chen')).toBe(false)
  expect(nameMatchesOwner('Anita Flores', null)).toBe(false)
})

test('name matches is whole-word tokens after foldText', () => {
  expect(nameMatchesOwner('Lee', 'KLEEMAN, ROBERT')).toBe(false)
  expect(nameMatchesOwner('Ng', 'YOUNG, SARAH')).toBe(false)
  expect(nameMatchesOwner('Okafor', 'OKAFOR FAMILY TRUST')).toBe(true)
  expect(nameMatchesOwner('Okafor', 'OKAFOR, MARILYN & DAVID')).toBe(true)
  expect(nameMatchesOwner('Garcia-Lopez', 'LOPEZ, ANA')).toBe(true)
  expect(nameMatchesOwner('Garcia-Lopez', 'GARCIA, ANA')).toBe(true)
  expect(nameMatchesOwner('De La Cruz', 'DE LA CRUZ, ELENA')).toBe(true)
})

test('house facts omit unknown pieces', () => {
  expect(formatHouseFacts({ beds: 3, baths: '2.0', sqft: 1600 })).toBe(
    '3 beds · 2 baths · 1,600 sq ft',
  )
  expect(formatHouseFacts({ beds: null, baths: null, sqft: null })).toBeNull()
})

test('done copy names people left out', () => {
  expect(reviewLeftOutDone(2)).toBe(
    "All done. 2 people won't get the email until you fix their address.",
  )
  expect(reviewLeftOutDone(1)).toBe(
    "All done. 1 person won't get the email until you fix their address.",
  )
})
