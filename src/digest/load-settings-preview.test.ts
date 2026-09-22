import { expect, test } from 'vitest'
import { scenarios } from '@/digest/fixtures/scenarios'
import { SAMPLE_LABEL } from '@/digest/skip-copy'
import { renderDigest } from '@/digest/render'

test('the 1142 Oakdale sample is the full fixture', () => {
  const full = scenarios.find((row) => row.name === 'full')
  if (!full) throw new Error('missing full')
  expect(full.input.parcel.address).toBe('1142 Oakdale Ave')
  const result = renderDigest(full.input)
  expect(result.send).toBe(true)
  expect(SAMPLE_LABEL).toMatch(/Sample — add your people/)
})
