import { expect, test } from 'vitest'
import { parseStatusParam, peopleListHref } from '@/people/url'

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
