import type { ColumnDetection, FieldRole, ImportRow } from '@/import/types'

const ALIASES: Record<string, FieldRole> = {
  name: 'name',
  'full name': 'name',
  fullname: 'name',
  'first name': 'first',
  first: 'first',
  firstname: 'first',
  'last name': 'last',
  last: 'last',
  lastname: 'last',
  surname: 'last',
  email: 'email',
  'e-mail': 'email',
  'e mail': 'email',
  address: 'address',
  'full address': 'address',
  street: 'street',
  city: 'city',
  zip: 'zip',
  'zip code': 'zip',
  zipcode: 'zip',
  'postal code': 'zip',
  'close date': 'closeDate',
  closedate: 'closeDate',
  closed: 'closeDate',
  'closing date': 'closeDate',
  'sold date': 'closeDate',
}

export const FIELD_OPTIONS: { role: FieldRole; label: string }[] = [
  { role: 'skip', label: 'This is the —' },
  { role: 'name', label: 'This is the name' },
  { role: 'first', label: 'This is the first name' },
  { role: 'last', label: 'This is the last name' },
  { role: 'email', label: 'This is the email' },
  { role: 'address', label: 'This is the address' },
  { role: 'street', label: 'This is the street' },
  { role: 'city', label: 'This is the city' },
  { role: 'zip', label: 'This is the ZIP' },
  { role: 'closeDate', label: 'This is the close date' },
]

export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function roleForHeader(header: string): FieldRole {
  return ALIASES[normalizeHeader(header)] ?? 'skip'
}

export function detectColumns(headers: string[]): ColumnDetection {
  const mapping = headers.map(roleForHeader)
  return { mapping, confident: mappingIsComplete(mapping) }
}

export function mappingIsComplete(mapping: FieldRole[]): boolean {
  const set = new Set(mapping)
  const hasName = set.has('name') || (set.has('first') && set.has('last'))
  const hasEmail = set.has('email')
  const hasAddress =
    set.has('address') || set.has('street') || (set.has('city') && set.has('zip'))
  return hasName && hasEmail && hasAddress
}

export function looksLikeHeaderRow(cells: string[]): boolean {
  if (!cells.length) return false
  return cells.some((cell) => roleForHeader(cell) !== 'skip')
}

export function applyMapping(
  table: string[][],
  mapping: FieldRole[],
  hasHeader: boolean,
): ImportRow[] {
  const data = hasHeader ? table.slice(1) : table
  return data.map((cells, index) => rowFromCells(cells, mapping, index + (hasHeader ? 2 : 1)))
}

export function rowFromCells(cells: string[], mapping: FieldRole[], line: number): ImportRow {
  const picked: Partial<Record<FieldRole, string>> = {}
  mapping.forEach((role, i) => {
    if (role === 'skip') return
    const value = (cells[i] ?? '').trim()
    if (!value) return
    picked[role] = picked[role] ? `${picked[role]} ${value}` : value
  })

  const name =
    picked.name?.trim() || [picked.first, picked.last].filter(Boolean).join(' ').trim()
  const address =
    picked.address?.trim() ||
    [picked.street, picked.city, picked.zip].filter(Boolean).join(', ')

  return {
    line,
    name,
    email: picked.email?.trim() ?? '',
    address,
    closeDate: parseCloseDate(picked.closeDate ?? ''),
  }
}

export function parseCloseDate(raw: string): string | null {
  const value = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const us = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (us) {
    return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`
  }
  return null
}
