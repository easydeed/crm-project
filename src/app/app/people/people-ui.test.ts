import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'
import { PeopleList } from '@/app/app/people/people-list'
import type { ContactListRow } from '@/db/contacts'
import { contactStatusLabel } from '@/people/status'
import { ancestors, byExpression, byTag, classTokens, classVariants, descendants, only, ownText, parseJsx } from '@/test/jsx'

function src(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

test('list columns are name, address, and status only', () => {
  const list = src('./people-list.tsx')
  expect(list).toContain('row.name')
  expect(list).toContain('row.addressRaw')
  expect(list).toContain('contactStatusLabel(row.status)')
  expect(list).toContain('Unsubscribed')
  expect(list).not.toContain('row.email')
  expect(list).not.toContain('row.phone')
  expect(list).not.toMatch(/engagement|last-opened|lastOpened|opened recently|send data/i)
  expect(list).not.toContain('row.candidates')
  expect(list).toContain(`/app/people/${'${row.id}'}/edit`)
})

test('each row reads as exactly its name, address, Edit and status: nothing else reaches the list', () => {
  // OR-041: rendered, so any grid or layout passes and any extra column or field fails.
  const row = (id: string, status: 'matched' | 'needs_review' | 'no_parcel', unsubscribed: boolean): ContactListRow => ({
    id, name: `Person ${id}`, email: `${id}@example.com`, phone: '909-555-0100', addressRaw: `${id} Main St`,
    closeDate: '2020-01-02', notes: 'a note', status, reviewState: 'pending' as const, parcelId: null,
    parcelAddress: null, parcelApn: 'APN-1', unsubscribed, homeownerAddressAt: null, groupIds: [], groupNames: ['A group'],
    candidates: [{ parcelId: 'p1', confidence: 0.9, reason: 'Close by address', rank: 1 }],
  })
  const rows = [row('a1', 'matched', false), row('b2', 'needs_review', false), row('c3', 'no_parcel', true)]
  const html = renderToStaticMarkup(createElement(PeopleList, { rows, selected: [], onToggle: () => {}, onToggleAll: () => {} }))
  const items = [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1]!)
  expect(items).toHaveLength(3)
  items.forEach((item, i) => {
    const r = rows[i]!
    const words = item.replace(/<[^>]*>/g, ' ').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
    const status = contactStatusLabel(r.status)
    expect(words).toBe([r.name, r.addressRaw, 'Edit', status, ...(r.unsubscribed ? ['Unsubscribed'] : [])].join(' '))
    expect(item.match(/type="checkbox"/g)).toHaveLength(1)
    expect(item).toContain(`href="/app/people/${r.id}"`)
    expect(item).toContain(`href="/app/people/${r.id}/edit"`)
  })
})

test('a homeowner address change is named on the contact', () => {
  const detail = src('./[id]/person-detail.tsx')
  expect(detail).toContain('Updated by the homeowner on')
})

test('people board has count, add people, search, and export of the filtered view', () => {
  const board = src('./people-board.tsx')
  expect(board).toContain('1 person')
  expect(board).toContain('people')
  expect(board).toContain('href="/app/people/import"')
  expect(board).toContain('Add people')
  expect(board).toContain('href="/app/people/review"')
  expect(board).toContain('Review them')
  expect(board).toContain('Name, email, or address')
  expect(board).toContain('filterPeople')
  expect(board).toContain('Export this list')
  expect(board).toContain('contactsToCsv(visible)')
  expect(board).not.toMatch(/engagement|last-opened|lastOpened|open-rate/i)
})

test('filters write status and group into the URL', () => {
  const filters = src('./people-filters.tsx')
  expect(filters).toContain('STATUS_FILTERS')
  expect(filters).toContain('peopleListHref')
  expect(filters).toContain('All people')
  expect(filters).toContain("'/app/people/review'")
})

test('bulk bar is only rendered when a selection exists', () => {
  const bar = src('./people-bulk-bar.tsx')
  expect(bar).toContain('if (!selected.length) return null')
  expect(bar).toContain('Add to group')
  expect(bar).toContain('Remove from group')
  expect(bar).toContain('Export')
  expect(bar).toContain('Delete')
  // OR-041: the bar stays in reach while scrolling, by sticky or fixed, at the bottom.
  const barJsx = parseJsx('app/app/people/people-bulk-bar.tsx')
  const reach = byTag(barJsx, 'div').map((element) => classTokens(barJsx, element))
    .find((tokens) => tokens.includes('bottom-0'))
  expect(reach?.some((token) => token === 'sticky' || token === 'fixed')).toBe(true)
  expect(bar).toContain('Delete ${names[0]}?')
})

test('groups stay on this page and are optional', () => {
  const groups = src('./group-manager.tsx')
  expect(groups).toContain('Groups are optional. Make one if you want to sort people.')
  expect(groups).toContain('New group')
  expect(groups).toContain('People stay on your list.')
  expect(groups).not.toMatch(/default group|Everyone|All contacts/i)
})

test('detail shows the listed fields, review href, and add to group', () => {
  const detail = src('./[id]/person-detail.tsx')
  expect(detail).toContain('Email')
  expect(detail).toContain('Phone')
  expect(detail).toContain('Address')
  expect(detail).toContain('Close date')
  expect(detail).toContain('Notes')
  expect(detail).toContain('Match')
  expect(detail).toContain('Groups')
  expect(detail).toContain('parcelAddress')
  expect(detail).toContain('parcelApn')
  expect(detail).toContain('Review this match')
  expect(detail).toContain('`/app/people/${person.id}/review`')
  expect(detail).toContain('REVIEW_WRONG_HOUSE')
  expect(detail).toContain("reviewQueueHref(person.id, 'wrong-house')")
  expect(detail).toContain('Fix the address')
  expect(detail).toContain('`/app/people/${person.id}/edit`')
  expect(detail).toContain('Delete ${person.name}?')
  expect(detail).toContain('AddToGroup')
  expect(detail).toContain('phoneDisplay(person.phone)')
})

test('edit form pre-fills every field and names the rematch save', () => {
  const form = src('./[id]/edit/person-form.tsx')
  expect(form).toContain('defaultValue={person.name}')
  expect(form).toContain("defaultValue={person.email ?? ''}")
  expect(form).toContain('phoneValue(person.phone)')
  expect(form).toContain('defaultValue={person.addressRaw}')
  expect(form).toContain('defaultValue={person.closeDate ?? \'\'}')
  expect(form).toContain('defaultValue={person.notes ?? \'\'}')
  expect(form).toContain('Saved. We re-checked the address.')
})

test('four states exist for the list and the person screen', () => {
  expect(src('./loading.tsx')).toContain('Loading your people')
  expect(src('./error.tsx')).toContain('couldn&apos;t load your people')
  expect(src('./people-board.tsx')).toContain('No people yet. Add a list to get started.')
  expect(src('./[id]/loading.tsx')).toContain('Loading this person')
  expect(src('./[id]/error.tsx')).toContain('couldn&apos;t load this person')
  expect(src('./[id]/not-found.tsx')).toContain('couldn&apos;t find that person')
})

test('person review opens the queue at that contact', () => {
  const review = src('./[id]/review/page.tsx')
  expect(review).not.toContain('That step is not built yet')
  expect(review).toContain('getContactForAccount')
  expect(review).toContain('reviewQueueHref(person.id)')
})

test('the delete confirmation says what really happens: a re-import brings them back', () => {
  const copy = "They'll stop getting the monthly note. If you import them again later, they'll come back."
  for (const file of ['./[id]/person-detail.tsx', './people-bulk-bar.tsx']) {
    const text = readFileSync(new URL(file, import.meta.url), 'utf8')
    expect(text).toContain(copy)
    expect(text).not.toMatch(/cannot be undone/i)
  }
})

test('each status is a tag in a token pair the contrast test checks; the label still carries it', async () => {
  const { STATUS_TAG_CLASS, UNSUBSCRIBED_TAG_CLASS } = await import('@/app/app/people/status-tag')
  const pairs = src('../../tokens.test.ts')
  const expected = {
    matched: ['green-text', 'green-soft'],
    needs_review: ['coral-text', 'coral-soft'],
    no_parcel: ['muted-ink', 'surface'],
  } as const
  for (const [status, [fg, bg]] of Object.entries(expected)) {
    expect(STATUS_TAG_CLASS[status as keyof typeof expected]).toContain(`bg-${bg} text-${fg}`)
    expect(pairs).toContain(`['${fg}', '${bg}', TEXT]`)
  }
  expect(UNSUBSCRIBED_TAG_CLASS).toContain('bg-surface text-muted-ink')
  expect(src('./people-list.tsx')).toContain('{contactStatusLabel(row.status)}</span>')
})

test('Delete is the outlined coral button on both screens, and the question it asks is unchanged', () => {
  const ui = src('./ui.ts')
  expect(ui).toMatch(/destructiveButtonClass =\s*'[^']*border-border[^']*text-coral-text/)
  for (const file of ['./[id]/person-detail.tsx', './people-bulk-bar.tsx']) {
    const text = src(file)
    expect(text).toMatch(/<button className=\{destructiveButtonClass\}[^>]*>\s*Delete/)
    expect(text).toContain('window.confirm(')
  }
})

test('the current filter is marked like the top bar: dark text on blue-soft, with aria-current', () => {
  const filters = src('./people-filters.tsx')
  // OR-041: the current mark is a blue-soft fill with ink words, marked by weight too. Any
  // padding or radius passes; blue words on that fill never do (4.42:1).
  const jsx = parseJsx('app/app/people/people-filters.tsx')
  const current = /const currentClass = '([^']*)'/.exec(filters)?.[1]?.split(' ') ?? []
  expect(current).toContain('bg-blue-soft')
  expect(current).toContain('font-semibold')
  expect(current.filter((token) => /^text-(?!\[)/.test(token)).every((token) => token === 'text-foreground')).toBe(true)
  for (const link of byTag(jsx, 'Link')) {
    for (const variant of classVariants(jsx, link)) {
      if (variant.includes('bg-blue-soft')) expect(variant.filter((token) => /^text-(?!\[)/.test(token)), variant.join(' ')).not.toContain('text-blue')
    }
  }
  expect(filters).not.toMatch(/text-blue\b/)
  expect(filters.match(/aria-current=/g)?.length).toBe(5)
})

test('the status column says only the schema status and Unsubscribed, never an engagement label', () => {
  const list = src('./people-list.tsx')
  // The export's engagement tags. Only the statuses the schema defines may appear here.
  expect(list).not.toMatch(/\bOpening\b|Never opened|\bQuiet\b|May have moved/)
  // OR-041: the cell is whatever element holds the status label, found by that expression rather
  // than by its class string. The words a reader sees in it, beside the label, are only these.
  const jsx = parseJsx('app/app/people/people-list.tsx')
  const label = only(byExpression(jsx, 'contactStatusLabel(row.status)'), 'status label')
  const cell = ancestors(label)[0]!
  const words = [cell, ...descendants(cell)]
    .flatMap((element) => ownText(jsx, element).split(/\s+/))
    .filter((word) => /^[A-Za-z][A-Za-z'-]*$/.test(word))
  expect(words).toEqual(['Unsubscribed'])
})
