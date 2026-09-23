import { expect, test } from 'vitest'
import { computeSignals } from '@/signals/compute'
import { scenarios } from '@/signals/fixtures/scenarios'

const FORBIDDEN = [
  /reconveyed/i,
  /reconveyance/i,
  /recorded transfer/i,
  /grant deed/i,
  /assessed value/i,
  /base year/i,
  /\bparcel\b/i,
  /portability/i,
  /deed prices/i,
  /title officer/i,
  /tax cap/i,
]

test('every detail sentence passes the plain-language test', () => {
  const details = scenarios.flatMap((scenario) => computeSignals(scenario.input).map((signal) => signal.detail))
  expect(details.length).toBeGreaterThan(0)
  for (const detail of details) {
    for (const re of FORBIDDEN) {
      expect(detail, `${detail} ${re}`).not.toMatch(re)
    }
    expect(detail).not.toMatch(/\$[\d,]+ of (the loan|their loan|the mortgage)/i)
    expect(detail).not.toMatch(/\bbalance\b/i)
  }
})

test('the tax signal stays conditional', () => {
  const scenario = scenarios.find((row) => row.name === 'a large tax gap with long tenure')
  const detail = computeSignals(scenario!.input)[0]?.detail ?? ''
  expect(detail).toBe(
    "They're taxed on $817,800 while homes on their street sell around $1,040,000. If they're over 55, they can carry that to their next house.",
  )
  expect(detail).toMatch(/If they're over 55/i)
  expect(detail).not.toMatch(/eligib/i)
  expect(detail).not.toMatch(/qualif/i)
  expect(detail).not.toMatch(/prop(osition)?\s*19/i)
})

test('a payoff sentence names no balance and no recording jargon', () => {
  const scenario = scenarios.find((row) => row.name === 'a reconveyance')
  const detail = computeSignals(scenario!.input)[0]?.detail ?? ''
  expect(detail).toBe(
    'Their mortgage was just paid off or refinanced. Something changed with their money this month.',
  )
  expect(detail).not.toMatch(/\$/)
})

test('a record sale uses the stored price, not a guess', () => {
  const scenario = scenarios.find((row) => row.name === 'a record-setting sale')
  expect(computeSignals(scenario!.input)[0]?.detail).toBe(
    'A house two doors down sold for $1,120,000 — the highest price their street has seen.',
  )
})

test('the floor signal is one plain sentence', () => {
  const scenario = scenarios.find((row) => row.name === 'quiet when nothing else is going on')
  expect(computeSignals(scenario!.input)[0]?.detail).toBe(
    "You haven't had a reason to call in a while.",
  )
})
