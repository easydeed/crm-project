import { expect, test } from 'vitest'
import {
  parseLeftOutParam,
  parseStatusParam,
  peopleListHref,
  reviewQueueHref,
} from '@/people/url'

test('needs_review stays in the people URL', () => {
  expect(parseStatusParam('needs_review')).toBe('needs_review')
  expect(peopleListHref({ status: 'needs_review' })).toBe('/app/people?status=needs_review')
})

test('status and group combine in the URL', () => {
  expect(
    peopleListHref({ status: 'matched', groupId: 'group-1' }),
  ).toBe('/app/people?status=matched&group=group-1')
  expect(parseStatusParam('bogus')).toBeUndefined()
  expect(peopleListHref({})).toBe('/app/people')
})

test('left-out people have a real list URL', () => {
  expect(parseLeftOutParam('1')).toBe(true)
  expect(parseLeftOutParam('no')).toBe(false)
  expect(peopleListHref({ status: 'no_parcel', leftOut: true })).toBe(
    '/app/people?status=no_parcel&leftOut=1',
  )
})

test('review queue hrefs open the queue and wrong house', () => {
  expect(reviewQueueHref()).toBe('/app/people/review')
  expect(reviewQueueHref('abc')).toBe('/app/people/review?contact=abc')
  expect(reviewQueueHref('abc', 'wrong-house')).toBe(
    '/app/people/review?contact=abc&mode=wrong-house',
  )
})
