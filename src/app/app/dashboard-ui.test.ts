import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

function src(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), 'utf8')
}

test('the dashboard is the send, the three names, and the homeowners', () => {
  const page = src('./page.tsx')
  expect(page).toContain('HomeSendCard')
  expect(page).toContain('CallList')
  expect(page).toContain('HomeownersSummary')
  const screen = [
    page,
    src('./call-list.tsx'),
    src('./home-card.tsx'),
    src('./homeowners.tsx'),
  ].join('\n')
  expect(screen).toContain('Worth a call this month')
  expect(screen).toContain('Your homeowners')
  expect(screen).not.toMatch(/progress|stat card|contact cap/i)
  expect(src('./call-list.tsx')).not.toContain('role="dialog"')
  expect(src('./call-list.tsx')).toContain('w-full')
  expect(src('./call-tags.ts')).toContain('Big sale next door')
  expect(src('./call-tags.ts')).toContain('Paid off their loan')
  expect(src('./call-tags.ts')).toContain('Taxes worth a talk')
  expect(src('./call-tags.ts')).toContain('Been a while')
})

test('paused sending still leaves room for the call list', () => {
  const schedule = src('../../jobs/schedule.ts')
  const paused = schedule.slice(schedule.indexOf('if (row.paused)'), schedule.indexOf('await scheduleAccount'))
  expect(paused).toContain('enqueueCallList')
  expect(paused).not.toContain("enqueue(\n      'compose'")
  expect(paused).not.toContain("enqueue(\n      'send'")
})
