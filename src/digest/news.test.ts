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
  for (const name of ['no street sales', 'static only']) {
    const result = renderDigest(byName(name).input)
    expect(result.send, name).toBe(false)
    if (result.send) continue
    expect(result.reason).toBe(NOTHING_NEW_REASON)
  }
})

test('a document recorded twenty days ago is news', () => {
  const row = byName('recent payoff') // invariant-ok
  const result = renderDigest(row.input)
  expect(result.send).toBe(true)
  if (!result.send) return
  expect(result.blocks).toEqual(['record', 'loan'])
  expect(result.text).toMatch(/Paid off or refinanced — recorded /)
})
