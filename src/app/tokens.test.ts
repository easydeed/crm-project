import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

const css = readFileSync(new URL('./globals.css', import.meta.url), 'utf8')

/** The custom properties declared in the first `:root { … }` after `from`. */
function tokensAfter(from: number): Record<string, string> {
  const open = css.indexOf(':root {', from)
  const block = css.slice(open, css.indexOf('}', open))
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/gi)].map((m) => [m[1]!, m[2]!.toLowerCase()]))
}

const light = tokensAfter(0)
const dark = tokensAfter(css.indexOf('@media (prefers-color-scheme: dark)'))

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

const TEXT = 4.5
const NON_TEXT = 3

/**
 * The pairs the system is built to use: [foreground, background, floor]. Anything drawn with
 * these tokens goes through one of these. --rule is decorative and deliberately absent.
 */
const PAIRS: Array<[string, string, number]> = [
  ['foreground', 'background', TEXT],
  ['background', 'foreground', TEXT],
  ['foreground', 'surface', TEXT],
  ['foreground', 'blue-soft', TEXT],
  ['foreground', 'coral-soft', TEXT],
  ['foreground', 'green-soft', TEXT],
  ['muted-ink', 'background', TEXT],
  // 4.56:1 light, 0.06 above the floor. Depends on it: the grey call tag (call-tags.ts) and
  // mutedClass (people/ui.ts) wherever it sits on --surface, including called call-list rows.
  // Also disabledClass (people/ui.ts): every disabled button's words. And the label column of
  // DetailsTable (details-table.tsx): the call panel's labels (OR-044) and the person page's
  // details (OR-045).
  // Darken --surface and this fails first; re-derive --muted-ink with it.
  ['muted-ink', 'surface', TEXT],
  ['blue', 'background', TEXT],
  ['on-blue', 'blue', TEXT],
  ['coral-text', 'background', TEXT],
  ['coral-text', 'coral-soft', TEXT],
  ['green-text', 'background', TEXT],
  ['green-text', 'green-soft', TEXT],
  ['border', 'background', NON_TEXT],
  ['border', 'surface', NON_TEXT],
  ['coral', 'background', NON_TEXT],
  ['coral', 'surface', NON_TEXT],
  ['green', 'background', NON_TEXT],
  ['green', 'surface', NON_TEXT],
  ['blue', 'surface', NON_TEXT],
  // OR-042: a text link on --surface (a called row, a panel strip). Never on --blue-soft (4.42:1).
  ['blue', 'surface', TEXT],
  // OR-042: the bar, its words and focus ring, and the current-page pill on it.
  ['on-bar', 'bar', TEXT],
  ['on-bar-current', 'bar-current', TEXT],
  ['bar-current', 'bar', NON_TEXT],
  // OR-043: the view-as banner, and its edge against the bar it sits above.
  ['on-alert', 'alert', TEXT],
  ['alert', 'bar', NON_TEXT],
]

test('every colour token has a light and a dark value', () => {
  expect(Object.keys(light).length).toBeGreaterThan(10)
  expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort())
})

describe.each([
  ['light', light],
  ['dark', dark],
])('%s scheme', (_scheme, tokens) => {
  test.each(PAIRS)('%s on %s clears %s:1', (fg, bg, floor) => {
    expect(tokens[fg], `--${fg} is not a token`).toBeDefined()
    expect(tokens[bg], `--${bg} is not a token`).toBeDefined()
    expect(contrast(tokens[fg]!, tokens[bg]!)).toBeGreaterThanOrEqual(floor)
  })
})

test('the ratio is the WCAG one', () => {
  expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
  expect(contrast('#767676', '#ffffff')).toBeCloseTo(4.54, 2)
})
