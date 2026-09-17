import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

test('top bar is three visible links, not a hamburger', () => {
  const src = readFileSync(new URL('./top-bar.tsx', import.meta.url), 'utf8')
  expect(src).toContain('href="/app/people"')
  expect(src).toContain('href="/app/addons"')
  expect(src).toContain('href="/app/settings"')
  expect(src).toContain('flex-nowrap')
  expect(src).not.toMatch(/hamburger|menu-icon|aria-expanded/i)
})
