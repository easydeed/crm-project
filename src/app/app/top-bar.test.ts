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

test('the bar stays a server component; each link reads only the pathname', () => {
  const bar = readFileSync(new URL('./top-bar.tsx', import.meta.url), 'utf8')
  const link = readFileSync(new URL('./nav-link.tsx', import.meta.url), 'utf8')
  expect(bar).not.toContain("'use client'")
  expect(link.startsWith("'use client'")).toBe(true)
  // The only props are the fixed href and label the server bar writes; no session or account data.
  expect(link).toContain('{ href, children }: { href: string; children: ReactNode }')
  expect(link).toContain('usePathname()')
  expect(link).not.toMatch(/fetch\(|getRuntimeDb|readRequestSession|account/)
})

test('the current page is marked, with dark text on blue-soft rather than blue on blue-soft', () => {
  const link = readFileSync(new URL('./nav-link.tsx', import.meta.url), 'utf8')
  expect(link).toContain("aria-current={current ? 'page' : undefined}")
  expect(link).toContain('bg-blue-soft')
  expect(link).toContain('text-foreground')
  expect(link).not.toMatch(/text-blue\b/)
})
