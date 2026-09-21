import type { ContactMatchStatus } from '@/people/status'

export function parseStatusParam(
  value: string | null | undefined,
): ContactMatchStatus | undefined {
  if (value === 'matched' || value === 'needs_review' || value === 'no_parcel') {
    return value
  }
  return undefined
}

export function peopleListHref(filters: {
  status?: ContactMatchStatus
  groupId?: string
}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.groupId) params.set('group', filters.groupId)
  const query = params.toString()
  return query ? `/app/people?${query}` : '/app/people'
}
