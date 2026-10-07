import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { daysBefore, liveOakdaleEvents } from '@/db/fixtures/e2e-live'

/**
 * OR-043. The browser pass's live events are dated from the run, never fixed: a fixed date checked
 * against a moving window expires on a calendar schedule, and nothing fails when it does.
 */
test('no date in the live fixtures is written as a literal', () => {
  const source = readFileSync(new URL('./e2e-live.ts', import.meta.url), 'utf8')
  expect(source).not.toMatch(/['"`]\d{4}-\d{2}-\d{2}/)
})

test('every live event lands in its window whatever the run date', () => {
  const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`)
  for (const now of [new Date('2026-01-01T08:00:00Z'), new Date('2031-07-15T23:30:00Z'), new Date()]) {
    const today = day(daysBefore(now, 0))
    const age = (iso: string) => (today - day(iso)) / 86_400_000
    const [nearby, older, loan] = liveOakdaleEvents(now)
    expect(age(nearby!.recordedAt)).toBeLessThanOrEqual(45) // the sale and loan windows
    expect(age(loan!.recordedAt)).toBeLessThanOrEqual(45)
    expect(age(older!.recordedAt)).toBeGreaterThan(45) // outside the sale window…
    expect(age(older!.recordedAt)).toBeLessThan(365) // …inside the 12-month street median
  }
})
