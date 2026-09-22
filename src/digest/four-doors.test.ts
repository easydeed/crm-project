import { expect, test } from 'vitest'
import { scenarios } from '@/digest/fixtures/scenarios'
import { renderDigest } from '@/digest/render'

test('four doors down includes MLS attribution when a listing is present', () => {
  const full = scenarios.find((row) => row.name === 'full')
  if (!full) throw new Error('missing full scenario')
  const result = renderDigest(full.input)
  expect(result.send).toBe(true)
  if (!result.send) return
  expect(result.blocks).toContain('four_doors')
  expect(result.html).toContain('data-mls-attribution')
  expect(result.text).toContain('Listing courtesy of Hillside Brokerage / Pat Rivera.')
  expect(result.text).toContain('410 Ashford Ave')
})

test('four doors is omitted when the listing is missing', () => {
  const none = scenarios.find((row) => row.name === 'no street sales')
  if (!none) throw new Error('missing scenario')
  const result = renderDigest(none.input)
  expect(result.send).toBe(true)
  if (!result.send) return
  expect(result.blocks).not.toContain('four_doors')
  expect(result.html).not.toContain('data-mls-attribution')
})
