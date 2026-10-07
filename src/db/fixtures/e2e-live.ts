import { AGENT_ID, agent } from '@/db/fixtures/la-verne'

/**
 * What the browser pass adds to the local scratch database after the seed (OR-043). Never the
 * seed itself: scripts/seed.ts stays fixed.
 *
 * Every date here is computed from the run's `now`. A fixed date checked against a moving window
 * expires on a calendar schedule: the seed's Oakdale sales (2024-25) aged out of the 45-day sale
 * window and the 12-month street median, and the dashboard lost three of its four call-tag kinds
 * without a test failing.
 */

/** A second agent whose people have nothing recent: a dashboard of "Been a while" rows. */
export const QUIET_AGENT_ID = '00000000-0000-4000-8000-000000000002'

export const quietAgent = {
  ...agent,
  id: QUIET_AGENT_ID,
  email: 'robin@hillside.example',
  name: 'Robin Ellis',
  brokerage: 'Hillside Homes',
  dre: '02114577',
  phone: '909-555-0190',
  mlsAgentId: null,
}

export { AGENT_ID }

/**
 * The quiet agent's people get fixed ids. Their call-list rows tie on score, and a tie is broken
 * by contact id, so random ids reorder the quiet dashboard on every reseed.
 */
export function quietContactId(index: number) {
  return `00000000-0000-4000-8002-${(index + 1).toString(16).padStart(12, '0')}`
}

/** `days` days before `now`, as a recorded date (YYYY-MM-DD). */
export function daysBefore(now: Date, days: number): string {
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  day.setUTCDate(day.getUTCDate() - days)
  return day.toISOString().slice(0, 10)
}
