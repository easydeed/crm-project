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
type Owner = 'OR-030' | 'OR-031' | 'OR-032' | 'OR-033' | 'OR-034' | 'OR-035' | 'OR-036' | 'permanent'
type Debt = { owner: Owner; why: string; colours: Record<string, number> }

const OWNERS: Owner[] = ['OR-030', 'OR-031', 'OR-032', 'OR-033', 'OR-034', 'OR-035', 'OR-036', 'permanent']

const DEBT: Record<string, Debt> = {
  // OR-030: /app, the call list
  'app/call-entry.tsx': {
    owner: 'OR-030',
    why: 'called name in fixed greys (--muted-ink); entry borders and tint at foreground opacity (--rule, --surface)',
    colours: { '#3d3d3d': 1, '#c8c8c8': 1, 'border-foreground/40': 1, 'border-foreground/15': 2, 'bg-foreground/5': 1 },
  },
  'app/call-panel.tsx': { owner: 'OR-030', why: 'panel border (--rule)', colours: { 'border-foreground/20': 1 } },
  'app/call-tags.ts': {
    owner: 'OR-030',
    why: 'tag tints and text, light and dark (--coral/--green/--blue-soft pairs, --muted-ink on --surface)',
    colours: {
      '#ffe3d9': 1, '#9c3a1f': 1, '#4a1f12': 1, '#ffc9b8': 1,
      '#dcf1e2': 1, '#1d6336': 1, '#10331d': 1, '#b6e6c4': 1,
      '#dde9f8': 1, '#1c4a82': 1, '#132a47': 1, '#bcd6f5': 1,
      '#e6e6e6': 1, '#3d3d3d': 1, '#333333': 1, '#dedede': 1,
    },
  },

  // OR-031: People
  'app/people/ui.ts': {
    owner: 'OR-031',
    why: 'muted text in fixed greys (--muted-ink); input outline ~1.5:1 (--border)',
    colours: { '#3d3d3d': 1, '#c8c8c8': 1, 'border-foreground/20': 1 },
  },
  'app/people/people-bulk-bar.tsx': { owner: 'OR-031', why: 'bar divider (--rule)', colours: { 'border-foreground/20': 1 } },
  'app/people/group-manager.tsx': { owner: 'OR-031', why: 'secondary text (--muted-ink)', colours: { 'text-foreground/80': 1 } },
  'app/people/[id]/add-to-group.tsx': { owner: 'OR-031', why: 'secondary text (--muted-ink)', colours: { 'text-foreground/80': 1 } },

  // OR-032: review queue
  'app/people/review/candidate-cards.tsx': { owner: 'OR-032', why: 'card border (--rule)', colours: { 'border-foreground/20': 1 } },

  // OR-033: add-ons
  'app/addons/addon-row.tsx': {
    owner: 'OR-033',
    why: 'row border and secondary text (--rule, --muted-ink)',
    colours: { 'border-foreground/20': 1, 'text-foreground/80': 1 },
  },
  'app/addons/addon-config-form.tsx': {
    owner: 'OR-033',
    why: 'form rule and secondary text (--rule or --border, --muted-ink)',
    colours: { 'border-foreground/40': 1, 'text-foreground/80': 1 },
  },
  'app/addons/addons-panel.tsx': { owner: 'OR-033', why: 'secondary text (--muted-ink)', colours: { 'text-foreground/80': 1 } },
  'app/addons/bill-bar.tsx': {
    owner: 'OR-033',
    why: 'inverted bar at background opacity (a token pair for the dark bar)',
    colours: { 'border-background/40': 1, 'text-background/80': 1 },
  },

  // OR-034: settings and billing
  'app/settings/field.tsx': {
    owner: 'OR-034',
    why: 'input outline ~1.5:1 (--border); hint text (--muted-ink)',
    colours: { 'border-foreground/20': 1, 'text-foreground/70': 1 },
  },
  'app/settings/phone-verification.tsx': { owner: 'OR-034', why: 'panel border (--rule)', colours: { 'border-foreground/40': 1 } },

  // OR-035: /app/start and import
  'app/start/start-flow.tsx': {
    owner: 'OR-035',
    why: 'where-to-find panel border and tint (--rule, --surface)',
    colours: { 'border-foreground/20': 1, 'bg-foreground/10': 1 },
  },
  'app/start/closings-results.tsx': {
    owner: 'OR-035',
    why: 'list dividers (--rule)',
    colours: { 'divide-foreground/15': 1, 'border-foreground/15': 1 },
  },
  'app/people/import/import-form.tsx': {
    owner: 'OR-035',
    why: 'textarea outline ~1.5:1 (--border); drop zone border and tint (--rule, --surface)',
    colours: { 'border-foreground/20': 1, 'border-foreground/30': 1, 'bg-foreground/5': 1 },
  },
  'app/people/import/column-mapping.tsx': { owner: 'OR-035', why: 'select outline ~1.5:1 (--border)', colours: { 'border-foreground/20': 1 } },

  // OR-036: auth screens
  'login/login-form.tsx': { owner: 'OR-036', why: 'input outline ~1.5:1 (--border)', colours: { 'border-foreground/20': 1 } },
  'register/register-form.tsx': { owner: 'OR-036', why: 'input outline ~1.5:1 (--border)', colours: { 'border-foreground/20': 1 } },

  // Permanent: admin is deliberately unstyled. It is an internal tool, outside the re-skin, and
  // these entries stay so the list records what admin carries rather than pretending it is clean.
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
}

const UTILITY = '(?:text|bg|border(?:-[trblxy])?|divide|ring|outline|accent|fill|stroke|decoration|placeholder|from|via|to|shadow|caret)'
const PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const RULES = [
  /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])/g,
  new RegExp(`(?<![\\w-])${UTILITY}-[a-z]+(?:-[a-z]+)*(?:-\\d{2,3})?\\/\\d{1,3}(?![\\w-])`, 'g'),
  new RegExp(`(?<![\\w-])${UTILITY}-(?:white|black|(?:${PALETTE})-\\d{2,3})(?![\\w/-])`, 'g'),
]

const appRoot = path.dirname(fileURLToPath(import.meta.url))

function coloursIn(file: string) {
  const text = readFileSync(path.join(appRoot, file), 'utf8')
  const found: Record<string, number> = {}
  for (const rule of RULES) for (const [match] of text.matchAll(rule)) found[match] = (found[match] ?? 0) + 1
  return found
}

function sourceFiles(dir: string): string[] {
  return readdirSync(path.join(appRoot, dir)).flatMap((name) => {
    const rel = path.join(dir, name)
    if (statSync(path.join(appRoot, rel)).isDirectory()) return sourceFiles(rel)
    return /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [rel] : []
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

test('/app is tokens only, apart from the debt listed here', () => {
  const files = sourceFiles('app').filter((file) => !(file in EXEMPT))
  expect(files.length).toBeGreaterThan(30)
  expect(files.flatMap(mismatches)).toEqual([])
})

test('listed debt outside /app is exact too', () => {
  const outside = Object.keys(DEBT).filter((file) => !file.startsWith('app/'))
  expect(outside.flatMap(mismatches)).toEqual([])
})
