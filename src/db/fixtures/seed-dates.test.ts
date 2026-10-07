import { expect, test } from 'vitest'
import { buildLaVerneFixtures } from '@/db/fixtures/la-verne'

/**
 * OR-043a. The seed is fixed by rule, and its recorded events feed windows measured from today:
 * 45 days for a sale or payoff nearby, 12 months for street sales and the street median. A fixed
 * date inside a window fires for a while and then stops, with nothing failing. The seed's newest
 * event (2025-03-21) was already outside every window on the day the seed was written.
 *
 * So no seeded event may be newer than that. A recent date belongs in e2e-live.ts, dated from the
 * run; an older one can never fire, and is only history.
 */
const NEWEST_SEED_EVENT = '2025-03-21'

test('no recorded event in the seed is newer than the seed has ever had', () => {
  const newer = buildLaVerneFixtures()
    .parcelEvents.filter((event) => event.recordedAt > NEWEST_SEED_EVENT)
    .map((event) => `${event.docNumber} ${event.kind} ${event.recordedAt}`)
  expect(newer).toEqual([])
})
