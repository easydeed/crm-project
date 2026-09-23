import { expect, test } from 'vitest'
import { computeSignals } from '@/signals/compute'
import { scenarios } from '@/signals/fixtures/scenarios'

test('every fixture returns the expected people, in order', () => {
  expect(scenarios.length).toBeGreaterThanOrEqual(10)
  for (const scenario of scenarios) {
    const got = computeSignals(scenario.input).map((signal) => ({
      contactId: signal.contactId,
      kind: signal.kind,
    }))
    expect(got, scenario.name).toEqual(scenario.expect)
    expect(got.length, scenario.name).toBeLessThanOrEqual(3)
    expect(new Set(got.map((row) => row.contactId)).size, scenario.name).toBe(got.length)
  }
})

test('fewer than three qualifying contacts is not padded', () => {
  const only = scenarios.find((scenario) => scenario.name.startsWith('an account with only one'))
  expect(computeSignals(only!.input)).toHaveLength(1)
  const none = scenarios.find((scenario) => scenario.name === 'an account with none')
  expect(computeSignals(none!.input)).toHaveLength(0)
})

test('a contact with two signals contributes the strongest only', () => {
  const scenario = scenarios.find((row) => row.name === 'a contact with two signals')
  const got = computeSignals(scenario!.input)
  expect(got).toHaveLength(1)
  expect(got[0]?.kind).toBe('sold_nearby')
  expect(got[0]?.detail).not.toMatch(/mortgage/i)
})
