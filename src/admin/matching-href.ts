import type { FailureStatusFilter } from '@/admin/matching-labels'

export function matchingHref(filters: {
  status?: FailureStatusFilter
  account?: string
  export?: boolean
}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.account) params.set('account', filters.account)
  const query = params.toString()
  const path = filters.export ? '/admin/matching/export' : '/admin/matching'
  return query ? `${path}?${query}` : path
}
