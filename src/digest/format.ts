const WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty',
]

export function parseDay(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim())
  if (!match) return null
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) }
}

export function dayFromAsOf(asOf: Date) {
  return { y: asOf.getUTCFullYear(), m: asOf.getUTCMonth() + 1, d: asOf.getUTCDate() }
}

export function monthsBetween(
  start: { y: number; m: number; d: number },
  end: { y: number; m: number; d: number },
) {
  let months = (end.y - start.y) * 12 + (end.m - start.m)
  if (end.d < start.d) months -= 1
  return months
}

export function withinTrailingMonths(
  recordedAt: string,
  asOf: Date,
  months: number,
) {
  const start = parseDay(recordedAt)
  if (!start) return false
  const end = dayFromAsOf(asOf)
  const gap = monthsBetween(start, end)
  return gap >= 0 && gap < months
}

export function daysBetween(
  start: { y: number; m: number; d: number },
  end: { y: number; m: number; d: number },
) {
  const a = Date.UTC(start.y, start.m - 1, start.d)
  const b = Date.UTC(end.y, end.m - 1, end.d)
  return Math.round((b - a) / 86_400_000)
}

export function withinTrailingDays(
  recordedAt: string,
  asOf: Date,
  days: number,
) {
  const start = parseDay(recordedAt)
  if (!start) return false
  const gap = daysBetween(start, dayFromAsOf(asOf))
  return gap >= 0 && gap <= days
}

export function formatMoney(amount: number) {
  return `$${Math.round(amount).toLocaleString('en-US')}`
}

export function formatAboutMoney(amount: number) {
  return `about ${formatMoney(amount)}`
}

export function formatRecordedDay(iso: string) {
  const day = parseDay(iso)
  if (!day) return iso
  const date = new Date(Date.UTC(day.y, day.m - 1, day.d))
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function wordNumber(n: number) {
  return WORDS[n] ?? String(n)
}

export function ownedForPhrase(recordedAt: string, asOf: Date) {
  const start = parseDay(recordedAt)
  if (!start) return null
  const months = monthsBetween(start, dayFromAsOf(asOf))
  if (months < 1) return null
  const years = Math.floor(months / 12)
  const leftover = months % 12
  if (years === 0) {
    return `You've owned it ${wordNumber(leftover)} ${leftover === 1 ? 'month' : 'months'}.`
  }
  const yearBit = `${wordNumber(years)} ${years === 1 ? 'year' : 'years'}`
  if (leftover === 0) return `You've owned it ${yearBit}.`
  return `You've owned it ${yearBit} and ${wordNumber(leftover)} ${leftover === 1 ? 'month' : 'months'}.`
}

export function streetLabel(address: string) {
  const stripped = address
    .replace(/,\s*.*$/, '')
    .replace(/\b(apt|apartment|unit|#)\s*[a-z0-9-]+\b/gi, '')
    .replace(/^\d+\s+/, '')
    .trim()
    .replace(
      /\b(ave|avenue|st|street|rd|road|blvd|boulevard|dr|drive|ct|court|ln|lane|way|pl|place)\.?$/i,
      '',
    )
    .trim()
  return stripped || address
}

export function latestOf<T extends { recordedAt: string; docNumber: string }>(
  events: T[],
) {
  return [...events].sort((left, right) => {
    if (left.recordedAt !== right.recordedAt) {
      return right.recordedAt.localeCompare(left.recordedAt)
    }
    return right.docNumber.localeCompare(left.docNumber)
  })[0]
}

export function medianAmount(amounts: number[]) {
  const sorted = [...amounts].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

export function roundToHundred(amount: number) {
  return Math.round(amount / 100) * 100
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
