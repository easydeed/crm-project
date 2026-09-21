import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { PeopleBoard } from '@/app/app/people/people-board'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { listContactsForAccount } from '@/db/contacts'
import { listGroupsForAccount } from '@/db/groups'
import { parseStatusParam } from '@/people/url'

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; group?: string }>
}) {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/people')

  const accountId = effectiveAccountId(session)
  const params = await searchParams
  const rows = await listContactsForAccount(accountId)
  const groups = await listGroupsForAccount(accountId)

  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">People</h1>
      <Suspense fallback={<p className="mt-3 text-[15px]">Loading your people…</p>}>
        <PeopleBoard
          rows={rows}
          groups={groups}
          readOnly={Boolean(session.viewingAsAccountId)}
          statusFromUrl={parseStatusParam(params.status)}
          groupFromUrl={params.group}
        />
      </Suspense>
    </main>
  )
}
