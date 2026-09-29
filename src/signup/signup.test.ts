import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { MLS_AGENT_ID_MESSAGE, parseOptionalMlsAgentId } from '@/config/account-fields'
import { filterPeople } from '@/people/filter'
import { peopleListHref } from '@/people/url'
import { AWKWARD } from '@/providers/fixtures/closed-listings'
import { closingToImportRow, homeownerName } from '@/signup/closings'
import { FEW_CLOSINGS } from '@/signup/closings-count'
import { START_COPY, addedLine, confirmLabel, foundLine, isFew, tickedLine } from '@/signup/copy'

const src = (relative: string) => readFileSync(new URL(relative, import.meta.url), 'utf8')

test('an MLS agent id is letters and digits; anything else is refused with one plain message', () => {
  expect(parseOptionalMlsAgentId('  CRMLS-P4700 ')).toEqual({ ok: true, mlsAgentId: 'CRMLS-P4700' })
  expect(parseOptionalMlsAgentId('c01998432')).toEqual({ ok: true, mlsAgentId: 'c01998432' })
  expect(parseOptionalMlsAgentId('')).toEqual({ ok: true, mlsAgentId: null })
  for (const bad of ['dana whitfield', 'id;drop', '-leading', 'x'.repeat(41), 'ab/cd', 'a@b']) {
    expect(parseOptionalMlsAgentId(bad)).toEqual({ ok: false, message: MLS_AGENT_ID_MESSAGE })
  }
})

test('a closing becomes an import row with no email, a full address, and a name that claims no person', () => {
  const row = closingToImportRow(AWKWARD.condoWithUnit, 3)
  expect(row).toEqual({
    line: 3,
    name: 'Homeowner at 2250 Foothill Blvd Unit 14',
    email: null,
    address: '2250 Foothill Blvd Unit 14, Upland, CA 91786',
    closeDate: '2025-06-30',
  })
  expect(homeownerName({ address: '1142 Oakdale Ave' })).toBe('Homeowner at 1142 Oakdale Ave')
})

test('found copy: the count, the singular, the ticked line, and the button all agree', () => {
  expect(foundLine(47)).toBe("We found 47 homes you've sold. Untick any you'd rather leave out.")
  expect(foundLine(1)).toContain('1 home ')
  expect(tickedLine(46, 47)).toBe('46 of 47 ticked')
  expect(confirmLabel(47)).toBe('Use these 47')
  expect(confirmLabel(1)).toBe('Use this 1')
})

test('the fewer-than-expected line shows for 1 to 4 closings, and not for 0 or 5', () => {
  expect(FEW_CLOSINGS).toBe(5)
  expect([0, 1, 4, 5, 47].map(isFew)).toEqual([false, true, true, false, false])
})

test('after importing, the copy says plainly there is no email and nothing sends without one', () => {
  expect(addedLine(47)).toBe(
    "47 homes added. We don't get email addresses from the MLS, so add those next — we can't send without one.",
  )
  expect(addedLine(1)).toMatch(/^1 home added\./)
})

test('found-nothing is a neutral fork: a status line with the upload path, never an error', () => {
  const flow = src('../app/app/start/start-flow.tsx')
  const nothingBlock = flow.slice(flow.indexOf('found.listings.length === 0'), flow.indexOf('id="upload"'))
  expect(nothingBlock).toContain('role="status"')
  expect(nothingBlock).not.toMatch(/role="alert"|red|error|destructive/i)
  expect(START_COPY.nothing).not.toMatch(/sorry|error|failed|invalid/i)
  // The upload path renders unconditionally, at full size, right after the search.
  expect(flow).toMatch(/<section id="upload"[\s\S]*<ImportForm/)
})

test('an unrecognized id is an inline field error with a where-to-find panel, distinct from found-nothing', () => {
  const flow = src('../app/app/start/start-flow.tsx')
  expect(flow).toContain('aria-invalid={malformed ? true : undefined}')
  expect(flow).toContain('START_COPY.whereTitle')
  expect(flow).toMatch(/malformed\.message/)
})

test('the results screen renders MLS attribution on every listing', () => {
  expect(src('../app/app/start/closings-results.tsx')).toMatch(
    /<MlsAttribution office=\{listing\.listingOffice\} agent=\{listing\.listingAgent\} variant="app" \/>/,
  )
})

test('People can filter to contacts missing an email, and the link says so', () => {
  const rows = [
    { name: 'A', email: 'a@example.com', addressRaw: '1 Main St', status: 'matched' as const, reviewState: 'pending' as const, groupIds: [] },
    { name: 'Homeowner at 2 Main St', email: null, addressRaw: '2 Main St', status: 'no_parcel' as const, reviewState: 'pending' as const, groupIds: [] },
  ]
  expect(filterPeople(rows, { noEmail: true }).map((row) => row.name)).toEqual(['Homeowner at 2 Main St'])
  expect(filterPeople(rows, {})).toHaveLength(2)
  expect(filterPeople(rows, { q: 'main' })).toHaveLength(2)
  expect(peopleListHref({ noEmail: true })).toBe('/app/people?noEmail=1')
})

test('the MLS import is framed as homes sold, written to whoever lives there now; past clients come from the agent’s own list', () => {
  expect(START_COPY.intro).toContain("the homes you've sold")
  expect(START_COPY.intro).toContain('goes to whoever lives there now')
  expect(START_COPY.listingSideNote).toContain('usually the buyer, not the seller you represented')
  expect(START_COPY.listingSideNote).toContain('Your past clients come from your own list')
  expect(foundLine(47)).not.toMatch(/client/i)
  // The dashboard's empty state covers both lists, so it no longer promises past clients.
  expect(src('../app/app/call-list.tsx')).not.toContain('past clients')
  expect(src('../app/app/start/page.tsx')).toContain('START_COPY.intro')
})
