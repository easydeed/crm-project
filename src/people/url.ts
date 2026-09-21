import type { ContactMatchStatus } from '@/people/status'

export function parseStatusParam(
  value: string | null | undefined,
): ContactMatchStatus | undefined {
  if (value === 'matched' || value === 'needs_review' || value === 'no_parcel') {
    return value
  }
  return undefined
}

export function parseLeftOutParam(value: string | null | undefined) {
  return value === '1' || value === 'true'
}

export function peopleListHref(filters: {
  status?: ContactMatchStatus
  groupId?: string
  leftOut?: boolean
}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.groupId) params.set('group', filters.groupId)
  if (filters.leftOut) params.set('leftOut', '1')
  const query = params.toString()
  return query ? `/app/people?${query}` : '/app/people'
}

export function reviewQueueHref(contactId?: string, mode?: 'wrong-house') {
  const params = new URLSearchParams()
  if (contactId) params.set('contact', contactId)
  if (mode) params.set('mode', mode)
  const query = params.toString()
  return query ? `/app/people/review?${query}` : '/app/people/review'
}
