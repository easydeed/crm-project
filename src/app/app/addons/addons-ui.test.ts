import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import { borderColours, byAttribute, byExpression, classNames, classTokens, descendants, only, parseJsx, tagOf } from '@/test/jsx'
import { fixtureRegistry } from '@/addons/fixtures'
import { AddonRow } from '@/app/app/addons/addon-row'
import { AddonsPanel } from '@/app/app/addons/addons-panel'
import { BANDS, EMPTY_STATE, NEXT_BILL, type AddonRowData } from '@/app/app/addons/row-data'

const src = (relative: string) => readFileSync(new URL(relative, import.meta.url), 'utf8')

function rowsFrom(enabled: Record<string, boolean> = {}): AddonRowData[] {
  return fixtureRegistry().list().map((addon) => ({
    key: addon.key, title: addon.title, blurb: addon.blurb, priceCents: addon.priceCents, priceNote: addon.priceNote,
    band: addon.band, requiresConfig: addon.requiresConfig, fields: addon.fields, summary: null, enabled: enabled[addon.key] === true, config: {},
  }))
}

const withoutSwitch = (html: string) => html.replace(/<button[^>]*role="switch"[\s\S]*?<\/button>/, '<switch/>')

test('a switched-off row renders at full contrast: only the switch differs from an on row', () => {
  const row = rowsFrom()[0]!
  const render = (enabled: boolean) => renderToStaticMarkup(createElement(AddonRow, { row, enabled, readOnly: false, onChange: () => {} }))
  const off = render(false)
  const on = render(true)
  expect(off).not.toEqual(on)
  expect(withoutSwitch(off)).toEqual(withoutSwitch(on))
  expect(withoutSwitch(off)).not.toMatch(/opacity|text-foreground\/|text-gray|disabled/)
  expect(off).toContain('aria-checked="false"')
  expect(on).toContain('aria-checked="true"')
  expect(off).toContain('>Off<')
})

test('the empty state renders when nothing is registered, with the bill still at the base price', () => {
  const html = renderToStaticMarkup(createElement(AddonsPanel, { rows: [], baseCents: 1900, readOnly: false }))
  expect(html).toContain(EMPTY_STATE.replace("'", '&#x27;'))
  expect(html).toContain('>$19</span>')
  expect(html).toContain(NEXT_BILL)
  expect(html).not.toContain('role="switch"')
})

test('two bands with their headings, the carrier note under texting, and a bill of only what is on', () => {
  const html = renderToStaticMarkup(createElement(AddonsPanel, { rows: rowsFrom({ fixture_texting: true }), baseCents: 1900, readOnly: false }))
  expect(html).toContain('>Extras</h2>')
  expect(html).toContain('>Texting your clients</h2>')
  const note = BANDS.find((band) => band.band === 'texting')!.note!
  expect(note).toBe("Phone carriers charge us to send text messages to people, and they make us register first. That's why this one costs more.")
  expect(html.indexOf('Texting your clients')).toBeLessThan(html.indexOf('Phone carriers charge us'))
  expect(html).toContain('$9 a month 250 included')
  expect(html).toContain('Free')
  expect(html).toContain('data-testid="bill-total">$28</span>')
  expect(html).not.toMatch(/<span>Fixture extra<\/span><span>\$2<\/span>/)
})

test('every switch action goes through assertWritable, so view-as cannot toggle', () => {
  const actions = src('./actions.ts')
  const exported = [...actions.matchAll(/export async function (\w+)\([^)]*\)[^{]*\{([\s\S]*?)\n\}/g)]
  expect(exported.map((m) => m[1])).toEqual(['enableAddonAction', 'disableAddonAction'])
  for (const [, name, body] of exported) expect(body, name).toMatch(/^\s*const gate = await writableAccountId\(\)\n\s*if \(!gate\.ok\) return gate\.result/)
  expect(actions).toContain('const gate = assertWritable(session)')
  expect(actions).toContain('if (!gate.ok) return { ok: false, result: { ok: false, reason: \'forbidden\', message: gate.error } }')
})

test('the page has four states', () => {
  expect(src('./loading.tsx')).toContain('Loading add-ons')
  expect(src('./error.tsx')).toContain('Try again')
  expect(src('./page.tsx')).toContain('AddonsPanel')
})

test('the bill bar is the bar pair at full strength, which the contrast test checks', () => {
  // OR-041: the bar and everything inside it. OR-042: on the bar pair, which keeps its own dark
  // values, so the bar stays navy in both themes instead of flipping with --foreground. Nothing in
  // it is muted, recoloured, filled or faded: every line is at full strength.
  const jsx = parseJsx('app/app/addons/bill-bar.tsx')
  const bar = only(byAttribute(jsx, 'aria-label', '"Your monthly bill"'), 'bill bar')
  const own = classTokens(jsx, bar)
  expect(own).toContain('bg-bar')
  expect(own).toContain('text-on-bar')
  for (const element of descendants(bar)) {
    for (const token of classTokens(jsx, element)) {
      expect(token, `${tagOf(jsx, element)}: ${token}`).not.toMatch(/muted|opacity|^(?:[a-z]+:)*bg-/)
      if (/^(?:[a-z]+:)*text-(?!\[)/.test(token)) expect(token, tagOf(jsx, element)).toBe('text-on-bar')
      // OR-046: an arbitrary text value is a size, never a colour. text-[#d4a84b] (the design's brass
      // total) slipped past the line above, which skips every text-[…].
      if (/^(?:[a-z]+:)*text-\[/.test(token)) expect(token, tagOf(jsx, element)).toMatch(/^(?:[a-z]+:)*text-\[\d+(?:\.\d+)?(?:px|rem)\]$/)
    }
    expect(borderColours(classTokens(jsx, element)).filter((colour) => colour !== 'border-on-bar')).toEqual([])
  }
  expect(src('../../tokens.test.ts')).toContain("['on-bar', 'bar', TEXT]")
})

test('the config form uses the shared fieldClass and keeps no input class of its own', () => {
  const form = src('./addon-config-form.tsx')
  expect(form.match(/className=\{fieldClass\}/g)).toHaveLength(2)
  expect(form).not.toMatch(/const \w*[iI]nput\w*Class\s*=/)
})

test('secondary lines on the page use mutedClass', () => {
  // OR-041: the element that renders each line carries mutedClass, whatever its spacing.
  for (const [file, expression] of [
    ['app/app/addons/addon-row.tsx', 'row.rowNote'],
    ['app/app/addons/addons-panel.tsx', 'note'],
    ['app/app/addons/addon-config-form.tsx', 'KEEPS_SETTINGS'],
  ] as const) {
    const jsx = parseJsx(file)
    expect(classNames(jsx, only(byExpression(jsx, expression), `{${expression}}`)), file).toContain('mutedClass')
  }
})

test('the error screen uses linkClass rather than a copy of its string', async () => {
  const { linkClass } = await import('@/app/app/people/ui')
  const error = src('./error.tsx')
  expect(error).not.toContain(linkClass)
  expect(error).toContain('linkClass')
})
