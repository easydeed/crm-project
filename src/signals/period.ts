export function periodOf(asOf: Date) {
  const month = asOf.getUTCMonth() + 1
  return `${asOf.getUTCFullYear()}-${String(month).padStart(2, '0')}`
}

export function shiftPeriod(period: string, delta: number) {
  const [yearText, monthText] = period.split('-')
  const index = Number(yearText) * 12 + (Number(monthText) - 1) + delta
  const year = Math.floor(index / 12)
  const month = (index % 12) + 1
  return `${year}-${String(month).padStart(2, '0')}`
}
