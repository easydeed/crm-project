import { expect, test } from 'vitest'
import { mergeShown } from '@/signals/shown'

test('a dismissed call counts as shown even without a list row', () => {
  const merged = mergeShown([], [{ contactId: 'c1', period: '2026-05' }])
  expect(merged).toEqual([{ contactId: 'c1', period: '2026-05' }])
})

test('the same person and month is only counted once', () => {
  const merged = mergeShown(
    [{ contactId: 'c1', period: '2026-05' }],
    [{ contactId: 'c1', period: '2026-05' }],
  )
  expect(merged).toHaveLength(1)
})
