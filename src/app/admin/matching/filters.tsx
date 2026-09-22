import Link from 'next/link'
import { matchingHref } from '@/admin/matching-href'
import type { FailureStatusFilter } from '@/admin/matching-labels'

const STATUS_FILTERS: Array<{ id?: FailureStatusFilter; label: string }> = [
  { label: 'All failures' },
  { id: 'needs_review', label: 'Needs a look' },
  { id: 'no_parcel', label: "Couldn't find" },
  { id: 'corrected', label: 'Wrong house?' },
]

export function MatchingFilters({
  status,
  account,
  accounts,
}: {
  status?: FailureStatusFilter
  account?: string
  accounts: Array<{ accountId: string; accountName: string }>
}) {
  return (
    <form className="mt-8 flex flex-wrap items-end gap-4" method="get">
      <label className="text-[15px]">
        Status
        <select
          className="mt-1 block rounded-md border border-foreground/20 bg-background px-3 py-2 text-[15px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          defaultValue={status ?? ''}
          name="status"
        >
          {STATUS_FILTERS.map((row) => (
            <option key={row.id ?? 'all'} value={row.id ?? ''}>
              {row.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-[15px]">
        Account
        <select
          className="mt-1 block rounded-md border border-foreground/20 bg-background px-3 py-2 text-[15px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          defaultValue={account ?? ''}
          name="account"
        >
          <option value="">All accounts</option>
          {accounts.map((row) => (
            <option key={row.accountId} value={row.accountId}>
              {row.accountName}
            </option>
          ))}
        </select>
      </label>
      <button
        className="rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        type="submit"
      >
        Filter
      </button>
      {status || account ? (
        <Link
          className="text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          href={matchingHref({})}
        >
          Clear
        </Link>
      ) : null}
    </form>
  )
}
