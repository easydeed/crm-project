export type RateRow = {
  status: 'matched' | 'needs_review' | 'no_parcel'
  matchSource: 'auto' | 'review' | 'corrected'
  noParcelKind: 'non_address' | 'unmatched' | null
}

export type MatchingRate = {
  street: number
  autoMatched: number
  matched: number
  autoMatchRate: number | null
  finalCoverage: number | null
}

export function isRealStreetAddress(row: Pick<RateRow, 'noParcelKind'>) {
  return row.noParcelKind !== 'non_address'
}

export function matchingRates(rows: RateRow[]): MatchingRate {
  const street = rows.filter(isRealStreetAddress)
  const autoMatched = street.filter(
    (row) => row.status === 'matched' && row.matchSource === 'auto',
  ).length
  const matched = street.filter((row) => row.status === 'matched').length
  return {
    street: street.length,
    autoMatched,
    matched,
    autoMatchRate: street.length ? autoMatched / street.length : null,
    finalCoverage: street.length ? matched / street.length : null,
  }
}

export function formatRate(rate: number | null, count: number, street: number) {
  if (rate == null || street === 0) return '—'
  return `${Math.round(rate * 100)}% · ${count} of ${street}`
}

/** Worst first: lowest auto-match rate, then lowest final coverage. */
export function compareAccountRates(
  left: MatchingRate,
  right: MatchingRate,
) {
  const leftAuto = left.autoMatchRate ?? 2
  const rightAuto = right.autoMatchRate ?? 2
  if (leftAuto !== rightAuto) return leftAuto - rightAuto
  const leftFinal = left.finalCoverage ?? 2
  const rightFinal = right.finalCoverage ?? 2
  return leftFinal - rightFinal
}
