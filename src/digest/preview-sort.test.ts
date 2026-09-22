import { expect, test } from 'vitest'
import { sortPreviewRows } from '@/digest/preview-sort'

test('skipped rows come first, then fewest blocks', () => {
  const rows = sortPreviewRows([
    { name: 'Zed', send: true, blocks: ['record', 'loan', 'taxes'] },
    { name: 'Ann', send: true, blocks: ['record', 'loan'] },
    { name: 'Mia', send: false, blocks: [] },
    { name: 'Bea', send: false, blocks: [] },
  ])
  expect(rows.map((row) => row.name)).toEqual(['Bea', 'Mia', 'Ann', 'Zed'])
})
