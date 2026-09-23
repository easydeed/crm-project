import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { CALL_TAGS } from '@/app/app/call-tags'
import { toCallList, type CallEntryRow } from '@/app/app/call-list-view'
import { callListPeriod } from '@/jobs/call-list-period'

const src = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')

function row(overrides: Partial<CallEntryRow>): CallEntryRow {
  return {
    contactId: 'c1',
    name: 'Dana Ruiz',
    kind: 'sold_nearby',
    detail: 'A house next door sold for $912,000.',
    score: 300,
    address: '1412 Foothill Blvd',
    closeDate: '2019-03-04',
    ...overrides,
  }
}

const three = [
  row({ contactId: 'a', name: 'Low', kind: 'quiet_a_while', score: 30 }),
  row({ contactId: 'b', name: 'High', kind: 'sold_nearby', score: 300 }),
  row({ contactId: 'c', name: 'Mid', kind: 'loan_paid_off', score: 150 }),
]

describe('call list states', () => {
  test('three entries render in score order with sentence, address, and close date', () => {
    const list = toCallList({ people: 9, matched: 5, rows: three })
    expect(list.kind).toBe('list')
    if (list.kind !== 'list') return
    expect(list.entries.map((entry) => entry.name)).toEqual(['High', 'Mid', 'Low'])
    expect(list.entries[0]).toMatchObject({
      sentence: 'A house next door sold for $912,000.',
      address: '1412 Foothill Blvd',
      closeDate: 'March 4, 2019',
    })
    expect(list.quiet).toBe(false)
  })

  test('fewer than three shows what exists plus the quiet line, never padded', () => {
    const one = toCallList({ people: 9, matched: 5, rows: [three[1]!] })
    expect(one).toMatchObject({ kind: 'list', quiet: true })
    if (one.kind === 'list') expect(one.entries).toHaveLength(1)
    const none = toCallList({ people: 9, matched: 5, rows: [] })
    expect(none).toEqual({ kind: 'list', entries: [], quiet: true })
  })

  test('no people points to import; people without a match point to review', () => {
    expect(toCallList({ people: 0, matched: 0, rows: [] })).toEqual({ kind: 'no-people' })
    expect(toCallList({ people: 4, matched: 0, rows: [] })).toEqual({ kind: 'no-matches' })
  })

  test('an unknown kind or a row without an address is dropped, not invented', () => {
    const list = toCallList({
      people: 3,
      matched: 3,
      rows: [row({ contactId: 'x', kind: 'engagement' }), row({ contactId: 'y', address: null })],
    })
    expect(list).toEqual({ kind: 'list', entries: [], quiet: true })
  })
})

test('tag text and color match the signal kind', () => {
  expect(CALL_TAGS.sold_nearby).toMatchObject({ label: 'Big sale next door', color: 'coral' })
  expect(CALL_TAGS.loan_paid_off).toMatchObject({ label: 'Paid off their loan', color: 'green' })
  expect(CALL_TAGS.tax_upside).toMatchObject({ label: 'Taxes worth a talk', color: 'blue' })
  expect(CALL_TAGS.quiet_a_while).toMatchObject({ label: 'Been a while', color: 'grey' })
})

test('the dashboard reads the same local-month period the job writes', () => {
  const lateOnTheLast = new Date('2026-10-01T05:30:00Z')
  expect(callListPeriod(lateOnTheLast, 'America/Los_Angeles')).toBe('2026-09')
  expect(callListPeriod(lateOnTheLast, null)).toBe('2026-10')
})

test('/app renders send status, call list, homeowners — in that order, nothing else', () => {
  const page = src('./page.tsx')
  const order = ['<HomeSendCard', '<CallListSection', '<HomeownersSection'].map((tag) =>
    page.indexOf(tag),
  )
  expect(order.every((at) => at > 0)).toBe(true)
  expect([...order].sort((a, b) => a - b)).toEqual(order)
  expect(page.match(/<[A-Z]\w+/g)?.filter((tag) => !['<HomeSendCard', '<CallListSection', '<HomeownersSection'].includes(tag))).toEqual([])
})

test('no stat cards, counters, or progress bars on /app', () => {
  for (const file of ['./page.tsx', './call-list.tsx', './call-entry.tsx', './call-panel.tsx', './homeowners-section.tsx', './home-card.tsx']) {
    expect(src(file)).not.toMatch(/<progress|role="progressbar"|%|\/250|stat-card|entries\.length\}/i)
  }
})

test('the call list shows every state', () => {
  const ui = src('./call-list.tsx')
  expect(ui).toContain('Worth a call this month')
  expect(ui).toContain('Quiet month. That happens.')
  expect(ui).toContain('href="/app/people/import"')
  expect(ui).toContain('href="/app/people/review"')
})

test('Call is live and opens a panel inline, never a modal', () => {
  const entry = src('./call-entry.tsx')
  const panel = src('./call-panel.tsx')
  expect(entry).not.toMatch(/disabled type="button">\s*Call/)
  expect(entry).toContain('aria-expanded={expanded}')
  expect(entry).toContain("{expanded ? 'Close' : 'Call'}")
  for (const file of [entry, panel]) {
    expect(file).not.toMatch(/<dialog|role="dialog"|aria-modal|fixed inset/)
  }
  expect(panel).toContain('href={`tel:+1${digits}`}')
  expect(panel).toContain('href={`mailto:${panel.email}`}')
})

test('both actions persist through server actions and undo for five seconds', () => {
  const entry = src('./call-entry.tsx')
  expect(entry).toContain('export const UNDO_SECONDS = 5')
  expect(entry).toContain("act('called')")
  expect(entry).toContain("act('dismissed')")
  expect(entry).toContain('Mark as called')
  expect(entry).toContain('Not now')
  expect(entry).toContain('undoCallAction(entry.contactId)')
})

test('the panel reuses the note’s own record and loan blocks', () => {
  const data = src('./call-list-data.ts')
  expect(data).toContain("import { renderRecord } from '@/digest/blocks/record'")
  expect(data).toContain("import { renderLoan } from '@/digest/blocks/loan'")
})

test('Not now hides a name without making the month quiet; called stays visible', () => {
  const list = toCallList({
    people: 9,
    matched: 5,
    rows: three.map((r) => ({ ...r, outcome: r.contactId === 'a' ? 'dismissed' : r.contactId === 'b' ? 'called' : null })),
  })
  if (list.kind !== 'list') throw new Error('expected a list')
  expect(list.entries.map((e) => [e.name, e.called])).toEqual([['High', true], ['Mid', false]])
  expect(list.quiet).toBe(false)
})

test('a paused account still gets its call list below the notice', () => {
  const page = src('./page.tsx')
  expect(page).not.toMatch(/kind === 'paused'|system-paused/)
  expect(page.indexOf('loadCallList(accountId)')).toBeGreaterThan(page.indexOf("'missing-account'"))
})

test('the person page shows the dates they were marked as called', () => {
  const detail = src('./people/[id]/person-detail.tsx')
  const page = src('./people/[id]/page.tsx')
  expect(detail).toContain('You called them on {day}.')
  expect(page).toContain('listCalledDates(accountId, person.id)')
})
