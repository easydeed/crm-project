import { expect, test } from 'vitest'
import { scenarios } from '@/digest/fixtures/scenarios'
import { renderDigest } from '@/digest/render'

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

function outsideRecord(text: string) {
  return text
    .split(/\n{2,}/)
    .filter((chunk) => !chunk.includes('Recorder stamp'))
    .join('\n')
}

test('plain language holds outside the record block on every scenario', () => {
  for (const scenario of scenarios) {
    const result = renderDigest(scenario.input)
    const body = result.send ? outsideRecord(result.text) : result.reason
    for (const re of FORBIDDEN) {
      expect(body, `${scenario.name} ${re}`).not.toMatch(re)
    }
  }
})
