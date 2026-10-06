import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

/**
 * Tokens only (OR-028, OR-029). Nothing under src/app/app may carry a hex colour, an
 * opacity-modified colour (foreground/20), or a named Tailwind palette colour (text-gray-500,
 * text-white), except what is listed here. This list is the only allowlist: each entry is the
 * exact set of colours a file still carries and how many times.
 *
 * The test fails both ways. A colour not listed is new debt. A listed colour that is gone is a
 * fix that forgot to delete its entry. A screen packet clears its entries and deletes them; the
 * owner says which packet that is. When only permanent entries remain, the debt is paid.
 */
type Owner = 'permanent'
type Debt = { owner: Owner; why: string; colours: Record<string, number> }

const OWNERS: Owner[] = ['permanent']

const DEBT: Record<string, Debt> = {
  // Permanent: admin is deliberately unstyled. It is an internal tool, outside the re-skin, and
  // these entries stay so the list records what admin carries rather than pretending it is clean.
  'digest/preview-panel.tsx': {
    owner: 'permanent',
    why: "the email's own canvas: the iframe shows the email as an inbox does, white in both themes",
    colours: { 'bg-white': 1 },
  },
  // Listed in OR-037, when the scan first walked all of /admin: the four entries below never covered it.
  'admin/accounts/table.tsx': { owner: 'permanent', why: 'admin, unstyled by decision', colours: { 'border-foreground/20': 1, 'border-foreground/10': 1 } },
  'admin/costs/cost-table.tsx': { owner: 'permanent', why: 'admin, unstyled by decision', colours: { 'border-black/20': 1, 'border-black/10': 2 } },
  'admin/deliverability/page.tsx': { owner: 'permanent', why: 'admin, unstyled by decision', colours: { 'border-black/20': 2, 'border-black/10': 2 } },
  'admin/jobs/jobs-table.tsx': { owner: 'permanent', why: 'admin, unstyled by decision', colours: { 'border-black/20': 1, 'border-black/10': 1 } },
  'admin/matching/failure-table.tsx': { owner: 'permanent', why: 'admin, unstyled by decision', colours: { 'border-foreground/20': 1, 'border-foreground/10': 1 } },
  'admin/matching/rates.tsx': { owner: 'permanent', why: 'admin, unstyled by decision', colours: { 'border-foreground/20': 1, 'border-foreground/10': 1 } },
  'admin/preview/account-table.tsx': { owner: 'permanent', why: 'admin, unstyled by decision', colours: { 'border-foreground/20': 1, 'border-foreground/10': 1 } },
  'admin/sends/[id]/page.tsx': { owner: 'permanent', why: 'admin, unstyled by decision', colours: { 'border-black/20': 3, 'border-black/10': 2 } },
  'admin/accounts/search.tsx': { owner: 'permanent', why: 'admin, unstyled by decision', colours: { 'border-foreground/20': 1 } },
  'admin/matching/filters.tsx': { owner: 'permanent', why: 'admin, unstyled by decision', colours: { 'border-foreground/20': 2 } },
  'admin/sends/filters.tsx': { owner: 'permanent', why: 'admin, unstyled by decision', colours: { 'border-foreground/20': 2 } },
  'admin/sends/sends-table.tsx': {
    owner: 'permanent',
    why: 'admin, unstyled by decision',
    colours: { '#f4e4e1': 1, 'border-black/20': 1, 'border-black/10': 2 },
  },
}

/**
 * Not debt. view-as-banner.tsx is deliberately loud and outside the app's visual system: it
 * exists to be impossible to miss while an admin views as an agent. Its background is INK_COLOR,
 * a named value in src/config, and its white text sits on that. Do not add it to DEBT.
 */
const EXEMPT: Record<string, string> = {
  'app/view-as-banner.tsx': 'view-as banner, deliberately outside the visual system',
  'globals.css': 'where the tokens are defined: every colour here is a token',
}

const UTILITY = '(?:text|bg|border(?:-[trblxy])?|divide|ring|outline|accent|fill|stroke|decoration|placeholder|from|via|to|shadow|caret)'
const PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
// A colour in every form it can be written (OR-038): the scan once knew hex and named utilities,
// so rgba(14,23,41,0.4) passed where #0e1729 failed. Match the value, not one spelling of it.
const FUNCTIONAL = 'rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix|color'
const RULES = [
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/g,
  new RegExp(`(?<![\\w.-])(?:${FUNCTIONAL})\\([^()]*(?:\\([^()]*\\)[^()]*)*\\)`, 'g'),
  new RegExp(`(?<![\\w-])${UTILITY}-[a-z]+(?:-[a-z]+)*(?:-\\d{2,3})?\\/\\d{1,3}(?![\\w-])`, 'g'),
  new RegExp(`(?<![\\w-])${UTILITY}-(?:white|black|(?:${PALETTE})-\\d{2,3})(?![\\w/-])`, 'g'),
  // A CSS colour keyword as an arbitrary value (text-[red]) or a quoted value in a style prop
  // (style={{ color: 'red' }}). Only inside style: call-tags.ts's `color: 'coral'` names a token.
  new RegExp(`(?<![\\w-])${UTILITY}-\\[(?:color:)?[a-zA-Z]+\\]`, 'g'),
  /(?<=style=\{\{[^}]*)\b\w*(?:[cC]olor|fill|stroke|background)\s*:\s*['"`][a-zA-Z]+['"`]/g,
]

const appRoot = path.dirname(fileURLToPath(import.meta.url))

function coloursInText(text: string) {
  const found: Record<string, number> = {}
  for (const rule of RULES) for (const [match] of text.matchAll(rule)) found[match] = (found[match] ?? 0) + 1
  return found
}

const coloursIn = (file: string) => coloursInText(readFileSync(path.join(appRoot, file), 'utf8'))

function sourceFiles(dir: string): string[] {
  return readdirSync(path.join(appRoot, dir)).flatMap((name) => {
    const rel = path.join(dir, name)
    if (statSync(path.join(appRoot, rel)).isDirectory()) return sourceFiles(rel)
    return /\.(tsx?|css)$/.test(name) && !/\.test\./.test(name) ? [rel] : []
  })
}

function mismatches(file: string) {
  const found = coloursIn(file)
  const listed = DEBT[file]?.colours ?? {}
  return [...new Set([...Object.keys(found), ...Object.keys(listed)])].flatMap((colour) => {
    const [have, want] = [found[colour] ?? 0, listed[colour] ?? 0]
    if (have > want) return [`${file}: ${colour} ×${have - want} is new debt`]
    if (have < want) return [`${file}: ${colour} ×${want - have} is gone, delete it from DEBT`]
    return []
  })
}

test('every debt entry names a packet that owns it, or is permanent', () => {
  for (const [file, debt] of Object.entries(DEBT)) {
    expect(OWNERS, file).toContain(debt.owner)
    expect(existsSync(path.join(appRoot, file)), `${file} does not exist`).toBe(true)
    expect(Object.keys(debt.colours).length, file).toBeGreaterThan(0)
  }
  for (const file of Object.keys(EXEMPT)) expect(existsSync(path.join(appRoot, file)), file).toBe(true)
})

test('all of src/app is tokens only, apart from the debt listed here', () => {
  // The whole tree, not a list of directories (OR-037). A list left src/app/digest unscanned while
  // its plain-text preview drew #ededed on white in dark mode.
  const files = sourceFiles('').filter((file) => !(file in EXEMPT))
  expect(files.length).toBeGreaterThan(30)
  expect(files.flatMap(mismatches)).toEqual([])
})

test('listed debt outside /app is exact too', () => {
  const outside = Object.keys(DEBT).filter((file) => !file.startsWith('app/'))
  expect(outside.flatMap(mismatches)).toEqual([])
})

test('the scan matches a colour however it is written, and leaves tokens alone', () => {
  // One spelling each. A colour this misses could reach any page unseen (OR-038).
  const colours = [
    '#0e1729', '#fff', '#fff8', '#0e172966',
    'rgb(14 23 41)', 'rgba(14,23,41,0.4)', 'hsl(220 49% 11%)', 'hsla(220,49%,11%,.4)', 'hwb(220 5% 84%)',
    'lab(8% 1 -12)', 'lch(8% 12 280)', 'oklab(0.2 0 -0.04)', 'oklch(0.2 0.04 265)',
    'color-mix(in srgb, var(--blue) 40%, white)', 'color(display-p3 0.05 0.09 0.16)',
    'text-foreground/70', 'border-black/10', 'text-gray-500', 'bg-white', 'text-[red]', 'bg-[color:navy]',
  ]
  for (const colour of colours) expect(Object.keys(coloursInText(` ${colour} `)), colour).toEqual([colour])
  for (const style of ["color: 'red'", 'backgroundColor: "white"']) {
    expect(Object.keys(coloursInText(`style={{ width: 1, ${style} }}`)), style).toEqual([style])
  }
  const tokens = 'text-foreground bg-blue-soft text-coral-text border-border bg-[var(--rule)] text-[15px] shadow-sm href="#main" style={{ width: size }} getColor(x) { color: "coral" }'
  expect(coloursInText(tokens)).toEqual({})
})
