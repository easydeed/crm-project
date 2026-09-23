import { expect, test } from 'vitest'
import {
  blocksInStoredHtml,
  formatRate,
  groupSkipReasons,
  shouldPause,
  tallyDelivery,
} from '@/admin/delivery-math'

test('pause only above 0.1% once 50 messages were delivered', () => {
  expect(shouldPause(49, 5)).toBe(false)
  expect(shouldPause(50, 0)).toBe(false)
  expect(shouldPause(1000, 1)).toBe(false)
  expect(shouldPause(50, 1)).toBe(true)
  expect(shouldPause(1000, 2)).toBe(true)
})

test('rates and domains count delivered messages, not bounces', () => {
  const totals = tallyDelivery(
    [
      { email: 'a@gmail.com' },
      { email: 'b@gmail.com' },
      { email: 'c@yahoo.com' },
    ],
    [
      { email: 'b@gmail.com', kind: 'hard_bounce' },
      { email: 'c@yahoo.com', kind: 'spam_complaint' },
    ],
    4,
  )
  expect(totals).toMatchObject({
    sent: 3,
    delivered: 2,
    bounced: 1,
    complained: 1,
    unsubscribed: 4,
  })
  expect(formatRate(totals.bounceRate)).toBe('33.3%')
  expect(formatRate(totals.complaintRate)).toBe('50.0%')
  expect(totals.domains.map((row) => row.domain)).toEqual(['gmail.com', 'yahoo.com'])
  expect(totals.domains[0]).toMatchObject({ sent: 2, bounced: 1, delivered: 1, complained: 0 })
  expect(totals.domains[1]).toMatchObject({ sent: 1, complained: 1, delivered: 1, bounced: 0 })
})

test('stored html names its blocks and skips group onto one line', () => {
  const html = '<!--block:taxes-->EXACT-STORED<!--block:street_sales-->'
  expect(blocksInStoredHtml(html)).toEqual(['taxes', 'street_sales'])
  expect(blocksInStoredHtml('no markers')).toEqual([])
  const grouped = groupSkipReasons([
    { reason: 'Nothing new on their street this month.' },
    { reason: 'Nothing new on their street this month.' },
    { reason: 'No house on the record yet.' },
  ])
  expect(grouped).toEqual([
    { reason: 'Nothing new on their street this month.', count: 2 },
    { reason: 'No house on the record yet.', count: 1 },
  ])
})
