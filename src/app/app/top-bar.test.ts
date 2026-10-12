import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { attribute, byTag, classVariants, only, parseJsx } from '@/test/jsx'

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

test('the current page is the light pill on the dark bar: the bar pair, with aria-current (OR-043)', () => {
  // Rewritten in OR-043. The mark was blue-soft until the bar went navy, where it would have nearly
  // vanished in dark (#1a2240 on #202b4f). Each look names exactly one text colour.
  const jsx = parseJsx('app/app/nav-link.tsx')
  const link = only(byTag(jsx, 'Link'), 'nav link')
  expect(attribute(jsx, link, 'aria-current')?.initializer?.getText(jsx.source)).toBe("{current ? 'page' : undefined}")
  const variants = classVariants(jsx, link)
  const current = variants.filter((tokens) => tokens.includes('bg-bar-current'))
  const rest = variants.filter((tokens) => !tokens.includes('bg-bar-current'))
  expect(current.length).toBe(1)
  expect(rest.length).toBe(1)
  const colours = (tokens: string[]) => tokens.filter((token) => /^text-(?!\[)/.test(token))
  expect(colours(current[0]!)).toEqual(['text-on-bar-current'])
  expect(colours(rest[0]!)).toEqual(['text-on-bar'])
  for (const tokens of variants) {
    expect(tokens.join(' ')).not.toMatch(/blue/)
    expect(tokens).toContain('focus-visible:outline-on-bar')
  }
})
