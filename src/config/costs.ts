/**
 * The plan price and every cost rate. No other file may hold one; the invariant
 * checker fails the build if it finds a rate anywhere else.
 *
 * A null rate is not set yet. /admin/costs shows "rate not set" and leaves COGS and
 * margin blank rather than guess. Set a rate by changing it here with a new effective date.
 */
export const PLAN = {
  effectiveDate: '2026-09-25',
  priceCents: 1900,
  contactLimit: 250,
} as const

export type CostRates = {
  effectiveDate: string
  /** Per call, keyed `${provider}:${operation}` as the metering wrapper records it. */
  providerCallCents: Record<string, number | null>
  /** Per email delivered. Fractions of a cent are fine. */
  sendCents: number | null
  /** Fixed monthly bills, spread evenly across agent accounts. */
  fixedMonthlyCents: { email: number | null; hosting: number | null }
}

export const COST_RATES: CostRates = {
  effectiveDate: '2026-09-25',
  providerCallCents: {
    'property:lookupParcel': null,
    'listing:listingsNear': null,
  },
  sendCents: null,
  fixedMonthlyCents: { email: null, hosting: null },
}

/** Rates may be fractions of a cent; what is shown is rounded to the cent. */
export function formatDollars(cents: number): string {
  const rounded = Math.round(cents)
  const sign = rounded < 0 ? '-' : ''
  const abs = Math.abs(rounded)
  return `${sign}$${Math.floor(abs / 100)}${abs % 100 ? `.${String(abs % 100).padStart(2, '0')}` : ''}`
}
