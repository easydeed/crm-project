import type { CostRates } from '@/config/costs'

export type LineCost = { count: number; costCents: number | null }

export type CostInputs = {
  accounts: { id: string; name: string; email: string; active: boolean }[]
  /** Summed by account and provider. unpricedCount is calls recorded while the rate was not set. */
  providerCalls: { accountId: string | null; provider: string; count: number; costCents: number; unpricedCount: number }[]
  sends: { accountId: string; count: number }[]
}

export type AccountCost = {
  id: string
  name: string
  email: string
  revenueCents: number
  parcel: LineCost
  mls: LineCost
  sends: LineCost
  otherCents: number | null
  cogsCents: number | null
  marginCents: number | null
  marginPct: number | null
}

export type CostReport = {
  rows: AccountCost[]
  unattributed: { parcel: LineCost; mls: LineCost }
  totals: { mrrCents: number; cogsCents: number | null; marginCents: number | null; marginPct: number | null }
  providerCallCount: number
}

const ZERO: LineCost = { count: 0, costCents: 0 }

function sum(values: (number | null)[]): number | null {
  return values.some((value) => value === null) ? null : values.reduce<number>((total, value) => total + (value ?? 0), 0)
}

function providerLine(calls: CostInputs['providerCalls'], accountId: string | null, provider: string): LineCost {
  const mine = calls.filter((call) => call.accountId === accountId && call.provider === provider)
  if (mine.length === 0) return ZERO
  const count = mine.reduce((total, call) => total + call.count, 0)
  const unpriced = mine.some((call) => call.unpricedCount > 0)
  return { count, costCents: unpriced ? null : mine.reduce((total, call) => total + call.costCents, 0) }
}

function percent(margin: number | null, revenue: number): number | null {
  if (margin === null || revenue === 0) return null
  return Math.round((margin / revenue) * 1000) / 10
}

/**
 * Margin per account from counted rows and the rates in costs.ts. A line with calls or
 * sends but no rate is unknown (null), and so is every total it feeds. Nothing is guessed.
 */
export function computeCosts(input: CostInputs, rates: CostRates, planPriceCents: number): CostReport {
  const { email, hosting } = rates.fixedMonthlyCents
  const fixed = email === null || hosting === null ? null : email + hosting
  const perAccountOther = fixed === null || input.accounts.length === 0 ? fixed : Math.round(fixed / input.accounts.length)

  const rows = input.accounts.map((account): AccountCost => {
    const sendCount = input.sends.find((row) => row.accountId === account.id)?.count ?? 0
    const sends: LineCost = { count: sendCount, costCents: sendCount === 0 ? 0 : rates.sendCents === null ? null : sendCount * rates.sendCents }
    const parcel = providerLine(input.providerCalls, account.id, 'property')
    const mls = providerLine(input.providerCalls, account.id, 'listing')
    const revenueCents = account.active ? planPriceCents : 0
    const cogsCents = sum([parcel.costCents, mls.costCents, sends.costCents, perAccountOther])
    const marginCents = cogsCents === null ? null : revenueCents - cogsCents
    return { ...account, revenueCents, parcel, mls, sends, otherCents: perAccountOther, cogsCents, marginCents, marginPct: percent(marginCents, revenueCents) }
  })

  // Unknown margins first: they are the ones that need a rate before anyone can judge them.
  rows.sort((a, b) => {
    if (a.marginCents === null || b.marginCents === null) return a.marginCents === null ? (b.marginCents === null ? a.name.localeCompare(b.name) : -1) : 1
    return a.marginCents - b.marginCents || a.name.localeCompare(b.name)
  })

  const unattributed = { parcel: providerLine(input.providerCalls, null, 'property'), mls: providerLine(input.providerCalls, null, 'listing') }
  const mrrCents = rows.reduce((total, row) => total + row.revenueCents, 0)
  const cogsCents = sum([...rows.map((row) => row.cogsCents), unattributed.parcel.costCents, unattributed.mls.costCents])
  const marginCents = cogsCents === null ? null : mrrCents - cogsCents
  const providerCallCount = input.providerCalls.reduce((total, call) => total + call.count, 0)
  return { rows, unattributed, totals: { mrrCents, cogsCents, marginCents, marginPct: percent(marginCents, mrrCents) }, providerCallCount }
}
