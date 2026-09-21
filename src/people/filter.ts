import type { ContactMatchStatus } from '@/people/status'

export type SearchableContact = {
  name: string
  email: string
  addressRaw: string
}

export function contactMatchesSearch(row: SearchableContact, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [row.name, row.email, row.addressRaw].some((value) =>
    value.toLowerCase().includes(needle),
  )
}

export type PeopleFilter = {
  status?: ContactMatchStatus
  groupId?: string
  q?: string
}

export function filterPeople<
  T extends SearchableContact & {
    status: ContactMatchStatus
    groupIds: string[]
  },
>(rows: T[], filters: PeopleFilter): T[] {
  return rows.filter((row) => {
    if (filters.status && row.status !== filters.status) return false
    if (filters.groupId && !row.groupIds.includes(filters.groupId)) return false
    return contactMatchesSearch(row, filters.q ?? '')
  })
}

export function countByStatus(rows: { status: ContactMatchStatus }[]) {
  const counts = {
    all: rows.length,
    matched: 0,
    needs_review: 0,
    no_parcel: 0,
  }
  for (const row of rows) counts[row.status] += 1
  return counts
}
