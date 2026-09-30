import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

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
  expect(list).toContain('grid-cols-[auto_minmax(0,1fr)_auto]')
  expect(list).toContain('text-right')
  expect(list).toContain('flex-col')
  expect(list).toContain(`/app/people/${'${row.id}'}/edit`)
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
  expect(bar).toContain('sticky bottom-0')
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
  expect(filters).toContain("const currentClass = 'rounded-md bg-blue-soft px-2 font-semibold text-foreground'")
  expect(filters).not.toMatch(/text-blue\b/)
  expect(filters.match(/aria-current=/g)?.length).toBe(5)
})

test('the status column says only the schema status and Unsubscribed, never an engagement label', () => {
  const list = src('./people-list.tsx')
  // The export's engagement tags. Only the statuses the schema defines may appear here.
  expect(list).not.toMatch(/\bOpening\b|Never opened|\bQuiet\b|May have moved/)
  const start = list.indexOf('<p className="text-right">')
  const cell = list.slice(start, list.indexOf('</p>', start))
  // The words a reader sees: JSX text between tags, less the {expressions} and the JS around them.
  const words = [...cell.matchAll(/>([^<>]*)</g)]
    .flatMap((m) => m[1]!.replace(/\{[^{}]*\}/g, ' ').split(/\s+/))
    .filter((word) => /^[A-Za-z][A-Za-z'-]*$/.test(word) && word !== 'null')
  expect(words).toEqual(['Unsubscribed'])
})
