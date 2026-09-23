import { redirect } from 'next/navigation'
import { AdminNav } from '@/app/admin/admin-nav'
import { SendFilters } from '@/app/admin/sends/filters'
import { SendsTable } from '@/app/admin/sends/sends-table'
import { readRequestSession } from '@/auth/current-session'
import { listSendsForAdmin } from '@/db/admin-sends'

export default async function AdminSendsPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; state?: string }>
}) {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/admin/sends')

  const params = await searchParams
  const accountId = params.account?.trim() || undefined
  const state = params.state?.trim() || undefined
  const rows = await listSendsForAdmin(session.accountId, { accountId, state })
  const all = await listSendsForAdmin(session.accountId, {})
  const accounts = [...new Map(all.map((row) => [row.accountId, row.accountName])).entries()].map(
    ([id, name]) => ({ id, name }),
  )
  const states = [...new Set(all.map((row) => row.state))].sort()

  return (
    <main className="px-4 py-10">
      <AdminNav />
      <h1 className="mt-6 text-[22px] font-semibold">Sends</h1>
      <SendFilters accountId={accountId} accounts={accounts} state={state} states={states} />
      {rows.length === 0 ? (
        <p className="mt-6 max-w-xl text-[15px]">
          No sends yet. They show up here after a monthly note is composed.
        </p>
      ) : (
        <SendsTable rows={rows} />
      )}
    </main>
  )
}
