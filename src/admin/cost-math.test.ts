import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { computeCosts } from '@/admin/cost-math'
import { COST_RATES, formatDollars, type CostRates } from '@/config/costs'

const RATES: CostRates = {
  effectiveDate: '2026-01-01',
  providerCallCents: { 'property:lookupParcel': 4, 'listing:listingsNear': 0.5 },
  sendCents: 0.1,
  fixedMonthlyCents: { email: 1500, hosting: 4500 },
}
const PRICE = 1900
const accounts = [
  { id: 'a', name: 'Avery', email: 'a@example.com', active: true },
  { id: 'b', name: 'Blake', email: 'b@example.com', active: true },
  { id: 'c', name: 'Casey', email: 'c@example.com', active: false },
]

test('margin per account and in total, from counted rows and the rates', () => {
  const report = computeCosts(
    {
      accounts,
      providerCalls: [
        { accountId: 'a', provider: 'property', count: 250, costCents: 1000, unpricedCount: 0 },
        { accountId: 'a', provider: 'listing', count: 40, costCents: 20, unpricedCount: 0 },
        { accountId: 'b', provider: 'property', count: 10, costCents: 40, unpricedCount: 0 },
        { accountId: null, provider: 'property', count: 5, costCents: 20, unpricedCount: 0 },
      ],
      sends: [
        { accountId: 'a', count: 250 },
        { accountId: 'b', count: 100 },
      ],
    },
    RATES,
    PRICE,
  )
  // other = (1500 + 4500) / 3 accounts = 2000 each
  // a: 1000 + 20 + 25 + 2000 = 3045 -> margin -1145
  // b: 40 + 0 + 10 + 2000 = 2050 -> margin -150
  // c: 0 + 0 + 0 + 2000 = 2000, no revenue -> margin -2000
  expect(report.rows.map((row) => [row.id, row.cogsCents, row.marginCents])).toEqual([
    ['c', 2000, -2000],
    ['a', 3045, -1145],
    ['b', 2050, -150],
  ])
  const a = report.rows.find((row) => row.id === 'a')!
  expect(a).toMatchObject({ revenueCents: 1900, parcel: { count: 250, costCents: 1000 }, mls: { count: 40, costCents: 20 }, sends: { count: 250, costCents: 25 }, otherCents: 2000 })
  expect(a.marginPct).toBe(-60.3)
  expect(report.rows.find((row) => row.id === 'c')?.marginPct).toBeNull()
  expect(report.unattributed.parcel).toEqual({ count: 5, costCents: 20 })
  expect(report.totals).toEqual({ mrrCents: 3800, cogsCents: 7115, marginCents: -3315, marginPct: -87.2 })
  expect(report.providerCallCount).toBe(305)
})

test('a line with activity and no rate is unknown, and so is everything it feeds', () => {
  const report = computeCosts(
    {
      accounts,
      providerCalls: [{ accountId: 'a', provider: 'property', count: 3, costCents: 0, unpricedCount: 3 }],
      sends: [{ accountId: 'b', count: 10 }],
    },
    { ...RATES, sendCents: null },
    PRICE,
  )
  const byId = Object.fromEntries(report.rows.map((row) => [row.id, row]))
  expect(byId.a?.parcel).toEqual({ count: 3, costCents: null })
  expect(byId.a?.cogsCents).toBeNull()
  expect(byId.b?.sends).toEqual({ count: 10, costCents: null })
  expect(byId.c?.cogsCents).toBe(2000)
  expect(report.totals.cogsCents).toBeNull()
  expect(report.totals.marginPct).toBeNull()
  expect(report.rows.map((row) => row.id)).toEqual(['a', 'b', 'c'])
})

test('with no provider calls there are no billable lookups, and a zero count costs nothing even unpriced', () => {
  const report = computeCosts({ accounts, providerCalls: [], sends: [] }, COST_RATES, PRICE)
  expect(report.providerCallCount).toBe(0)
  expect(report.rows[0]?.parcel).toEqual({ count: 0, costCents: 0 })
  expect(report.rows[0]?.sends).toEqual({ count: 0, costCents: 0 })
  const page = readFileSync(new URL('../app/admin/costs/page.tsx', import.meta.url), 'utf8')
  expect(page).toContain('report.providerCallCount === 0')
  expect(page).toContain('No billable lookups yet.')
})

test('no rate is invented: every shipped rate is null until someone sets it', () => {
  expect(Object.values(COST_RATES.providerCallCents).every((rate) => rate === null)).toBe(true)
  expect(COST_RATES.sendCents).toBeNull()
  expect(COST_RATES.fixedMonthlyCents).toEqual({ email: null, hosting: null })
  expect(formatDollars(1900)).toBe('$19')
  expect(formatDollars(2.4)).toBe('$0.02')
  expect(formatDollars(-1145)).toBe('-$11.45')
})
