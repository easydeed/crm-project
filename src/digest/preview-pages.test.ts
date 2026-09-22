import { expect, test } from 'vitest'
import { scenarios } from '@/digest/fixtures/scenarios'
import {
  previewFileBody,
  previewIndexHtml,
  scenarioFileName,
} from '@/digest/preview-pages'
import { renderDigest } from '@/digest/render'

test('scenario file names are stable slugs', () => {
  expect(scenarioFileName('full')).toBe('full.html')
  expect(scenarioFileName('no street sales')).toBe('no-street-sales.html')
  expect(scenarioFileName('thin')).toBe('thin.html')
})

test('index lists send decision, blocks, and skip reason', () => {
  const rows = scenarios.map((scenario) => {
    const result = renderDigest(scenario.input)
    return {
      name: scenario.name,
      file: scenarioFileName(scenario.name),
      send: result.send,
      blocks: result.send ? result.blocks : [],
      reason: result.send ? undefined : result.reason,
    }
  })
  const html = previewIndexHtml(rows)
  expect(html).toContain('full.html')
  expect(html).toContain('thin.html')
  expect(html).toContain('Send')
  expect(html).toContain('Skip')
  expect(html).toContain('Nothing new on their street this month.')
})

test('skipped preview files show the reason and no empty frame', () => {
  const thin = scenarios.find((row) => row.name === 'thin')
  if (!thin) throw new Error('missing thin')
  const result = renderDigest(thin.input)
  expect(result.send).toBe(false)
  if (result.send) return
  const html = previewFileBody(result)
  expect(html).toContain(result.reason)
  expect(html).not.toContain('iframe')
})
