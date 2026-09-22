import Link from 'next/link'
import { redirect } from 'next/navigation'
import { matchingHref } from '@/admin/matching-href'
import { parseFailureStatus } from '@/admin/matching-labels'
import { FailureTable } from '@/app/admin/matching/failure-table'
import { MatchingFilters } from '@/app/admin/matching/filters'
import { AccountRatesTable, MatchingSummary } from '@/app/admin/matching/rates'
import { readRequestSession } from '@/auth/current-session'
import {
  listMatchingFailuresForAdmin,
  listMatchingOverviewForAdmin,
} from '@/db/admin-matching'

export default async function AdminMatchingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; account?: string }>
}) {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/admin/matching')

  const params = await searchParams
  const status = parseFailureStatus(params.status)
  const account = params.account?.trim() || undefined
  const overview = await listMatchingOverviewForAdmin(session.accountId)
  const failures = await listMatchingFailuresForAdmin(session.accountId, {
    status,
    accountId: account,
  })

  return (
    <main className="px-4 py-10">
      <p className="text-[15px]">
        <Link
          className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/admin/accounts"
        >
          Accounts
        </Link>
      </p>
      <h1 className="mt-6 text-[22px] font-semibold">Matching</h1>
      {overview.overall.street === 0 ? (
        <p className="mt-6 text-[15px]">
          Import people on an account to score matching.
        </p>
      ) : (
        <>
          <MatchingSummary overall={overview.overall} />
          <AccountRatesTable rows={overview.accounts} />
        </>
      )}
      <h2 className="mt-10 text-[22px] font-semibold">Failures</h2>
      <MatchingFilters
        status={status}
        account={account}
        accounts={overview.accounts}
      />
      <p className="mt-4 text-[15px]">
        <Link
          className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          href={matchingHref({ status, account, export: true })}
        >
          Export fixtures
        </Link>
      </p>
      <FailureTable rows={failures} />
    </main>
  )
}
