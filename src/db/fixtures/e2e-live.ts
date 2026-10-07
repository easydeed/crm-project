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

/** A recorded event on an Oakdale house, by house number. */
export type LiveEvent = { house: number; kind: 'grant_deed' | 'reconveyance'; docNumber: string; recordedAt: string; amount: number | null }

/**
 * Three events that give the seeded agent's three Oakdale people three different call tags this
 * month, whatever month it is. The seed's Oakdale houses are 1840 (Maya), 1852 (Luis), 1866 (Elena).
 *
 * - 1836 sells 10 days ago, two doors from 1840 and eight from 1852: "Big sale next door" for Maya.
 * - 1852 records a reconveyance 5 days ago: "Paid off their loan" for Luis.
 * - 1900 sold 120 days ago: outside the 45-day sale window, inside the 12-month street median.
 *   With 1836 it puts Oakdale's median at $520,000, against Elena's assessed $427,000: "Taxes worth
 *   a talk". The median is kept low so Luis's tax score stays under his loan score.
 */
export const LIVE_HOUSES = [1836, 1900]
export const CALL_TAG_KINDS = ['sold_nearby', 'loan_paid_off', 'tax_upside'] as const

export function liveOakdaleEvents(now: Date): LiveEvent[] {
  return [
    { house: 1836, kind: 'grant_deed', docNumber: 'E2E-LIVE-1836', recordedAt: daysBefore(now, 10), amount: 510_000 },
    { house: 1900, kind: 'grant_deed', docNumber: 'E2E-LIVE-1900', recordedAt: daysBefore(now, 120), amount: 530_000 },
    { house: 1852, kind: 'reconveyance', docNumber: 'E2E-LIVE-1852', recordedAt: daysBefore(now, 5), amount: null },
  ]
}
