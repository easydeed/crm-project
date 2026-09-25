import { expect, test } from 'vitest'
import { computeBill } from '@/addons/bill'
import { fixtureRegistry } from '@/addons/fixtures'
import { PLAN } from '@/config/costs'

test('the bill total is right for every combination of enabled add-ons', () => {
  const addons = fixtureRegistry().list()
  for (let mask = 0; mask < 1 << addons.length; mask += 1) {
    const flags = addons.map((addon, i) => ({ ...addon, enabled: Boolean(mask & (1 << i)) }))
    const bill = computeBill(PLAN.priceCents, flags)
    const expected = PLAN.priceCents + flags.filter((addon) => addon.enabled).reduce((sum, addon) => sum + addon.priceCents, 0)
    expect(bill.totalCents, `mask ${mask}`).toBe(expected)
    expect(bill.lines.map((line) => line.key)).toEqual(['base', ...flags.filter((addon) => addon.enabled).map((addon) => addon.key)])
  }
  expect(computeBill(1900, []).totalCents).toBe(1900)
})
