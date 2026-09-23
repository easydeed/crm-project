import { expect, test } from 'vitest'
import { callListNote } from '@/app/app/call-states'

test('each call-list state has one plain line', () => {
  expect(callListNote({ matchedCount: 4, entryCount: 3, openCount: 2, sendDay: 15, needsReview: false })).toBeNull()
  expect(callListNote({ matchedCount: 4, entryCount: 1, openCount: 1, sendDay: 15, needsReview: false })?.note).toBe(
    'Quiet month. That happens.',
  )
  expect(callListNote({ matchedCount: 0, entryCount: 0, openCount: 0, sendDay: 15, needsReview: true })).toMatchObject({
    href: '/app/people/review',
  })
  expect(callListNote({ matchedCount: 0, entryCount: 0, openCount: 0, sendDay: 15, needsReview: false })).toMatchObject({
    href: '/app/people/import',
  })
  expect(callListNote({ matchedCount: 4, entryCount: 3, openCount: 0, sendDay: 1, needsReview: false })?.note).toBe(
    'All caught up. Next batch on the 1st.',
  )
  expect(callListNote({ matchedCount: 4, entryCount: 3, openCount: 0, sendDay: 15, needsReview: false })?.note).toBe(
    'All caught up. Next batch on the 15th.',
  )
})
