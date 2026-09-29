import type { Contact } from './types'

export type AudienceFilter = {
  ownedYears: number | null
  gapOver: number | null
  openedLast3: boolean
  zip: string
  propType: 'any' | 'single' | 'condo'
  noContactMonths: number | null
}

export const EMPTY_FILTER: AudienceFilter = {
  ownedYears: null,
  gapOver: null,
  openedLast3: false,
  zip: 'any',
  propType: 'any',
  noContactMonths: null,
}

/** Cities mapped to representative ZIPs so the ZIP filter reads realistically. */
export const CITY_ZIP: Record<string, string> = {
  'La Verne': '91750',
  Claremont: '91711',
  'San Dimas': '91773',
  Glendora: '91741',
  Pomona: '91767',
}

export const ZIP_OPTIONS = ['any', ...Object.values(CITY_ZIP)]

const NOW = new Date('2026-08-31')

function yearsOwned(iso: string): number {
  const start = new Date(iso + 'T00:00:00')
  return (NOW.getTime() - start.getTime()) / (365.25 * 24 * 3600 * 1000)
}

/** Deterministic hash so synthetic fields are stable across renders. */
function hash(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000
  return h
}

export function propTypeOf(c: Contact): 'single' | 'condo' {
  return hash(c.id) % 5 === 0 ? 'condo' : 'single'
}

export function monthsSinceContact(c: Contact): number {
  switch (c.engagement) {
    case 'opened_recently':
      return 1
    case 'quiet':
      return 4
    case 'moved':
      return 12
    default:
      return 9
  }
}

export function marketGap(c: Contact): number {
  if (!c.record) return 0
  return Math.max(0, c.record.streetMedian - c.record.assessedValue)
}

export function matchesFilter(c: Contact, f: AudienceFilter): boolean {
  if (f.ownedYears != null && yearsOwned(c.closedDate) < f.ownedYears) return false
  if (f.gapOver != null && marketGap(c) < f.gapOver) return false
  if (f.openedLast3 && c.engagement !== 'opened_recently') return false
  if (f.zip !== 'any' && CITY_ZIP[c.city] !== f.zip) return false
  if (f.propType !== 'any' && propTypeOf(c) !== f.propType) return false
  if (f.noContactMonths != null && monthsSinceContact(c) < f.noContactMonths)
    return false
  return true
}

export function filterContacts(
  contacts: Contact[],
  f: AudienceFilter,
): Contact[] {
  return contacts.filter((c) => matchesFilter(c, f))
}

/** Turn an active filter into readable chips. */
export function filterChips(f: AudienceFilter): string[] {
  const chips: string[] = []
  if (f.ownedYears != null) chips.push(`owned ${f.ownedYears}+ years`)
  if (f.gapOver != null)
    chips.push(`gap over $${(f.gapOver / 1000).toFixed(0)}k`)
  if (f.openedLast3) chips.push('opened last 3')
  if (f.zip !== 'any') chips.push(`ZIP ${f.zip}`)
  if (f.propType !== 'any') chips.push(f.propType === 'condo' ? 'condos' : 'single-family')
  if (f.noContactMonths != null)
    chips.push(`no contact in ${f.noContactMonths} months`)
  return chips
}
