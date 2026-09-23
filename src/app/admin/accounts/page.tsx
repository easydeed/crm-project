import Link from 'next/link'
import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { listAccountsForAdmin, type AccountListDir, type AccountListSort } from '@/db/admin-accounts'
import { AccountsTable } from '@/app/admin/accounts/table'
import { AccountsSearch } from '@/app/admin/accounts/search'

function asSort(value: string | undefined): AccountListSort {
  return value === 'contacts' ? 'contacts' : 'signup'
}

function asDir(value: string | undefined): AccountListDir {
  return value === 'asc' ? 'asc' : 'desc'
}

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; dir?: string }>
}) {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/admin/accounts')

  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const sort = asSort(params.sort)
  const dir = asDir(params.dir)
  const rows = await listAccountsForAdmin(session.accountId, { q, sort, dir })

  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">Accounts</h1>
      <AccountsSearch q={q} />
      {rows.length === 0 ? (
        <p className="mt-6 text-[15px]">{q ? 'No accounts match.' : 'No accounts yet.'}</p>
      ) : (
        <AccountsTable rows={rows} q={q} sort={sort} dir={dir} />
      )}
      <p className="mt-8 flex flex-wrap gap-4 text-[15px]">
        <Link
          className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/admin/matching"
        >
          Matching
        </Link>
        <Link
          className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/admin/sends"
        >
          Sends
        </Link>
        <Link
          className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/admin/deliverability"
        >
          Deliverability
        </Link>
        <Link
          className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/app"
        >
          Back to app
        </Link>
      </p>
    </main>
  )
}
