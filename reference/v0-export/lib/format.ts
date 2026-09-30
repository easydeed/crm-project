export function currency(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

export function shortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function monthYear(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/** Years and months owned, from a close date to a fixed "now". */
export function ownedFor(iso: string, now = new Date('2026-08-31')): string {
  const start = new Date(iso + 'T00:00:00')
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) months -= 1
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (years === 0) return `${rem} month${rem === 1 ? '' : 's'}`
  if (rem === 0) return `${years} year${years === 1 ? '' : 's'}`
  return `${years} year${years === 1 ? '' : 's'} and ${rem} month${rem === 1 ? '' : 's'}`
}
