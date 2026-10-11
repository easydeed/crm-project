import { expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { ancestors, attribute, byAttribute, byTag, byText, classNames, classTokens, descendants, only, parseJsx, tagOf, withAttribute } from '@/test/jsx'

/**
 * OR-044. The dashboard's panels and the send card's emphasis, asked as properties: what each
 * element is and which tokens it carries, not the exact class string.
 */
const PANEL = ['border', 'border-rule', 'rounded-xl']
const STRIP = ['bg-surface', 'border-b', 'border-rule', 'text-[19px]', 'font-semibold']

test('the call list and homeowners are panels, each titled in a --surface header strip', () => {
  for (const file of ['app/app/call-list.tsx', 'app/app/homeowners-section.tsx']) {
    const jsx = parseJsx(file)
    const panel = only(byTag(jsx, 'section'), `panel in ${file}`)
    expect(classTokens(jsx, panel), file).toEqual(expect.arrayContaining(PANEL))
    const title = only(descendants(panel).filter((element) => tagOf(jsx, element) === 'h2'), `title in ${file}`)
    expect(classTokens(jsx, title), file).toEqual(expect.arrayContaining(STRIP))
  }
})

test('the send card is the plain panel: on the page, with no strip', () => {
  for (const file of ['app/app/home-card.tsx', 'app/app/home-billing-card.tsx']) {
    const jsx = parseJsx(file)
    for (const card of byTag(jsx, 'section')) {
      const tokens = classTokens(jsx, card)
      expect(tokens, file).toEqual(expect.arrayContaining(PANEL))
      expect(tokens.filter((token) => token.startsWith('bg-')), file).toEqual(['bg-background'])
      expect(descendants(card).filter((element) => tagOf(jsx, element) === 'h2'), file).toEqual([])
    }
  }
})

test('the call panel is a table: labels muted on --surface, values on the page, links at 44px', () => {
  // The cells live in the shared table (OR-045), which the call panel renders every row through.
  const table = parseJsx('app/app/details-table.tsx')
  expect(classTokens(table, only(byTag(table, 'dt'), 'label cell'))).toEqual(expect.arrayContaining(['bg-surface', 'text-muted-ink']))
  expect(classTokens(table, only(byTag(table, 'dd'), 'value cell'))).toContain('bg-background')
  const jsx = parseJsx('app/app/call-panel.tsx')
  expect(byTag(jsx, 'dt')).toHaveLength(0)
  expect(byTag(jsx, 'DetailsRow')).toHaveLength(1)
  const links = byTag(jsx, 'a')
  expect(links).toHaveLength(2)
  for (const link of links) expect(classTokens(jsx, link)).toContain('tap')
  // The note's own blocks, under their own labels: never a listing under "On the record".
  expect(byAttribute(jsx, 'label', '"Recorded against the property"')).toHaveLength(1)
  expect(byAttribute(jsx, 'label', '"On the record"')).toHaveLength(2)
})

test('the rows are ranked in an <ol>, the numeral in ink and hidden from screen readers', () => {
  const list = parseJsx('app/app/call-list.tsx')
  expect(byTag(list, 'ol')).toHaveLength(1)
  expect(byTag(list, 'ul')).toHaveLength(0)
  const entry = parseJsx('app/app/call-entry.tsx')
  const numeral = only(byAttribute(entry, 'aria-hidden', '"true"'), 'numeral')
  expect(classTokens(entry, numeral).filter((token) => /^text-(?!\[)/.test(token))).toEqual([])
  // Call and Close: the secondary button, as drawn. Mark as called keeps the primary.
  const toggle = only(withAttribute(entry, 'aria-expanded'), 'Call toggle')
  expect(classNames(entry, toggle)).toContain('secondaryButtonClass')
})

test('Preview it is the button; Skip this month posts from a form, styled as a link', () => {
  const jsx = parseJsx('app/app/home-card.tsx')
  const preview = only(byText(jsx, 'Preview it'), 'Preview it')
  expect(tagOf(jsx, preview)).toBe('Link')
  expect(classNames(jsx, preview)).toContain('buttonClass')
  const skip = only(byText(jsx, 'Skip this month'), 'Skip this month')
  expect(tagOf(jsx, skip)).toBe('button')
  expect(attribute(jsx, skip, 'type')?.initializer?.getText(jsx.source)).toBe('"submit"')
  expect(classNames(jsx, skip)).toContain('linkClass')
  const form = ancestors(skip).find((element) => tagOf(jsx, element) === 'form')
  expect(form && attribute(jsx, form, 'action')?.initializer?.getText(jsx.source)).toBe('{skipMonthAction}')
})

test('the call panel label column is wide enough for its longest label (OR-047)', () => {
  // Measured, not read: at 88px "Recorded against the property" was four lines and "Recorded"
  // overflowed by 4px. 118px is the narrowest that takes it in three; 170px takes it in two.
  const source = readFileSync(new URL('./call-panel.tsx', import.meta.url), 'utf8')
  const labels = /const LABELS = '([^']+)'/.exec(source)?.[1] ?? ''
  const phone = Number(/(?:^| )grid-cols-\[(\d+)px_1fr\]/.exec(labels)?.[1] ?? 0)
  const wide = Number(/sm:grid-cols-\[(\d+)px_1fr\]/.exec(labels)?.[1] ?? 0)
  expect(phone).toBeGreaterThanOrEqual(118)
  expect(wide).toBeGreaterThanOrEqual(170)
})
