import { expect, test } from 'vitest'
import { scenarios } from '@/digest/fixtures/scenarios'
import { renderDigest } from '@/digest/render'

test('loan copy never shows a remaining balance', () => {
  for (const scenario of scenarios) {
    const result = renderDigest(scenario.input)
    const body = result.send ? result.text : result.reason
    expect(body, scenario.name).not.toMatch(
      /remaining balance|payoff|loan balance|current balance|left to pay/i,
    )
    if (result.send && result.blocks.includes('loan') && scenario.name === 'loan paid off') {
      expect(result.text).toMatch(/Paid off or refinanced — recorded /)
    }
  }
})
