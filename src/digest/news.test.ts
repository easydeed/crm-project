import { expect, test } from 'vitest'
import { scenarios } from '@/digest/fixtures/scenarios'
import { renderDigest } from '@/digest/render'
import { NOTHING_NEW_REASON } from '@/digest/skip-copy'

function byName(name: string) {
  const row = scenarios.find((scenario) => scenario.name === name)
  if (!row) throw new Error(`missing ${name}`)
  return row
}

test('record and loan alone are not news', () => {
  for (const name of ['no street sales', 'static only', 'recent payoff']) {
    const result = renderDigest(byName(name).input)
    expect(result.send, name).toBe(false)
    if (result.send) continue
    expect(result.reason).toBe(NOTHING_NEW_REASON)
  }
})

test('a document recorded on their own house is not news', () => {
  const row = byName('recent payoff')
  const result = renderDigest(row.input)
  expect(result.send).toBe(false)
  if (result.send) return
  expect(result.reason).toBe(NOTHING_NEW_REASON)
})

test('a recent own-house recording still sends when the street has news', () => {
  const row = byName('recent payoff with street sales')
  const result = renderDigest(row.input)
  expect(result.send).toBe(true)
  if (!result.send) return
  expect(result.blocks).toEqual(['record', 'taxes', 'street_sales', 'loan'])
  expect(result.text).toMatch(/Paid off or refinanced — recorded /)
})
