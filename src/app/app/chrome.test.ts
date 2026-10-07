import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { ancestors, attribute, byAttribute, byTag, byText, classTokens, descendants, only, parseJsx, tagOf } from '@/test/jsx'

/** OR-043. The chrome every /app screen shares, by property. */
const textColours = (tokens: string[]) => tokens.filter((token) => /^(?:[a-z-]+:)*text-(?!\[)/.test(token))
const fills = (tokens: string[]) => tokens.filter((token) => /^(?:[a-z-]+:)*bg-/.test(token))

test('the bar is navy on the bar pair, and everything on it uses the bar\'s colours', () => {
  const jsx = parseJsx('app/app/top-bar.tsx')
  const header = only(byTag(jsx, 'header'), 'header')
  const own = classTokens(jsx, header)
  expect(fills(own)).toEqual(['bg-bar'])
  expect(textColours(own)).toEqual(['text-on-bar'])
  for (const element of descendants(header)) {
    const tokens = classTokens(jsx, element)
    expect(fills(tokens), tagOf(jsx, element)).toEqual([])
    expect(textColours(tokens).every((token) => token === 'text-on-bar'), tagOf(jsx, element)).toBe(true)
    for (const outline of tokens.filter((token) => /outline-(?!offset|2\b|none)[a-z]/.test(token) && !/^focus-visible:outline$/.test(token))) {
      expect(outline, tagOf(jsx, element)).toBe('focus-visible:outline-on-bar')
    }
  }
})

test('the view-as banner is the alert pair, in the flow of the page, with no colour of its own', () => {
  const source = readFileSync(new URL('./view-as-banner.tsx', import.meta.url), 'utf8')
  expect(source).not.toMatch(/style=\{|INK_COLOR/)
  const jsx = parseJsx('app/app/view-as-banner.tsx')
  const banner = only(byTag(jsx, 'div'), 'banner')
  const tokens = classTokens(jsx, banner)
  expect(fills(tokens)).toEqual(['bg-alert'])
  expect(textColours(tokens)).toEqual(['text-on-alert'])
  // Fixed needed the page padded to its height, which was wrong on a phone (05-open item 10).
  expect(tokens).not.toContain('fixed')
  expect(tokens).toContain('sticky')
  for (const element of descendants(banner)) {
    expect(textColours(classTokens(jsx, element)).every((token) => token === 'text-on-alert')).toBe(true)
  }
})

test('Log out is a button in a form that runs logoutAction: a link would be a dead control', () => {
  const jsx = parseJsx('app/app/layout.tsx')
  const button = only(byText(jsx, 'Log out'), '"Log out"')
  expect(tagOf(jsx, button)).toBe('button')
  expect(attribute(jsx, button, 'type')?.initializer?.getText(jsx.source)).toBe('"submit"')
  const form = ancestors(button).find((element) => tagOf(jsx, element) === 'form')
  expect(form && attribute(jsx, form, 'action')?.initializer?.getText(jsx.source)).toBe('{logoutAction}')
  expect(byAttribute(jsx, 'href', '"/logout"')).toEqual([])
})
