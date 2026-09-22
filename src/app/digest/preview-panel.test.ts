import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

const src = readFileSync(new URL('./preview-panel.tsx', import.meta.url), 'utf8')

test('preview frame is sandboxed and does not leak email css onto the page', () => {
  expect(src).toContain('sandbox=""')
  expect(src).toContain('srcDoc={html}')
  expect(src).toContain("title=\"Email preview\"")
  expect(src).toContain("label: 'Desktop'")
  expect(src).toContain("label: 'Phone'")
  expect(src).toContain("value: '600'")
  expect(src).toContain("value: '380'")
  expect(src).toContain("label: 'Email'")
  expect(src).toContain("label: 'Plain text'")
  expect(src).toContain('aria-pressed')
  expect(src).toContain('motion-reduce:transition-none')
  expect(src).not.toContain('@import')
  expect(src).not.toMatch(/assertWritable/)
})

test('skip shows a reason and no empty frame', () => {
  expect(src).toContain('result.reason')
  expect(src).toContain('result.send')
})
