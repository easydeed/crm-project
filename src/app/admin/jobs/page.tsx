import Link from 'next/link'
import { redirect } from 'next/navigation'
import { JobsTable } from '@/app/admin/jobs/jobs-table'
import { readRequestSession } from '@/auth/current-session'
import { listRecentJobsForAdmin } from '@/db/admin-jobs'

export default async function AdminJobsPage() {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/admin/jobs')

  const rows = await listRecentJobsForAdmin()

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
      <h1 className="mt-6 text-[22px] font-semibold">Jobs</h1>
      {rows.length === 0 ? (
        <p className="mt-6 max-w-xl text-[15px]">
          No jobs yet. The cron tick will pick up work when something is
          enqueued.
        </p>
      ) : (
        <JobsTable rows={rows} />
      )}
    </main>
  )
}
