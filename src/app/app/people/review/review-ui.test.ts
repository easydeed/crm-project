import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

function src(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

test('queue page loads one person at a time with an accurate header', () => {
  const page = src('./page.tsx')
  const queue = src('./review-queue.tsx')
  expect(page).toContain('listReviewQueueForAccount')
  expect(page).toContain('loadWrongHouseReview')
  expect(queue).toContain('reviewHeader(index + 1, list.length)')
  expect(queue).toContain('current.candidates')
})

test('needs_review cards show typed name, address, and This one', () => {
  const queue = src('./review-queue.tsx')
  const cards = src('./candidate-cards.tsx')
  expect(queue).toContain('REVIEW_YOU_GAVE_US')
  expect(queue).toContain('current.name')
  expect(queue).toContain('current.addressRaw')
  expect(queue).toContain('REVIEW_NONE_OF_THESE')
  expect(cards).toContain('card.street')
  expect(cards).toContain('card.city')
  expect(cards).toContain('card.zip')
  expect(cards).toContain('card.recordedOwner')
  expect(cards).toContain('formatHouseFacts')
  expect(cards).toContain('card.reason')
  expect(cards).toContain('REVIEW_NAME_MATCHES')
  expect(cards).toContain('card.nameMatches')
  expect(cards).toContain('REVIEW_THIS_ONE')
  expect(cards).toContain('md:grid-cols-3')
  expect(cards).toContain('grid-cols-1')
})

test('no_parcel options rematch or leave them out', () => {
  const panel = src('./no-parcel-panel.tsx')
  expect(panel).toContain('REVIEW_COULDNT_FIND')
  expect(panel).toContain('REVIEW_FIX_ADDRESS')
  expect(panel).toContain('REVIEW_LEAVE_OUT')
  expect(panel).toContain('REVIEW_LEAVE_OUT_MUTED')
})

test('done states and left-out link are real', () => {
  const done = src('./done-state.tsx')
  expect(done).toContain('REVIEW_ALL_ON_MAP')
  expect(done).toContain('reviewLeftOutDone')
  expect(done).toContain('REVIEW_BACK_TO_PEOPLE')
  expect(done).toContain("peopleListHref({ status: 'no_parcel', leftOut: true })")
  expect(done).toContain('href="/app/people"')
})

test('undo is a five-second control', () => {
  const queue = src('./review-queue.tsx')
  expect(queue).toContain('UNDO_MS = 5000')
  expect(queue).toContain('REVIEW_UNDO')
  expect(queue).toContain('undoReviewDecisionAction')
})

test('four states exist for the review screen', () => {
  expect(src('./loading.tsx')).toContain('Loading the next person')
  expect(src('./error.tsx')).toContain('couldn&apos;t load this review')
  expect(src('./done-state.tsx')).toContain('REVIEW_ALL_ON_MAP')
  expect(src('./review-queue.tsx')).toContain('REVIEW_YOU_GAVE_US')
})

test('review UI stays 15px with focus rings', () => {
  const files = [
    './review-queue.tsx',
    './candidate-cards.tsx',
    './no-parcel-panel.tsx',
    './done-state.tsx',
    './error.tsx',
    './loading.tsx',
  ]
  for (const file of files) {
    const text = src(file)
    expect(text).toMatch(/text-\[15px\]|text-\[22px\]/)
    if (text.includes('<button') || text.includes('<Link')) {
      expect(text).toMatch(/focus-visible:outline|buttonClass|linkClass|fieldClass/)
    }
  }
})
