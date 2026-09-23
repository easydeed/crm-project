import { redirect } from 'next/navigation'
import { CallList } from '@/app/app/call-list'
import { HomeSendCard } from '@/app/app/home-card'
import { HomeownersSummary } from '@/app/app/homeowners'
import { loadHomeSend } from '@/app/app/home-send'
import { listHomeownerSummary, loadDashboardCalls } from '@/app/app/load-call-list'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'

export default async function AppHomePage() {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app')

  const accountId = effectiveAccountId(session)
  const view = await loadHomeSend(accountId)
  if (view.kind === 'missing-account') {
    return (
      <main className="px-4 py-10">
        <h1 className="text-[22px] font-semibold">We could not load your account.</h1>
        <p className="mt-3 max-w-xl text-[15px]">
          Sign out and sign in again. If it keeps happening, the account may have been
          removed.
        </p>
      </main>
    )
  }

  const [calls, homeowners] = await Promise.all([
    loadDashboardCalls(accountId),
    listHomeownerSummary(accountId),
  ])
  const readOnly = Boolean(session.viewingAsAccountId)

  return (
    <main className="px-4 py-10">
      <HomeSendCard readOnly={readOnly} view={view} />
      <CallList entries={calls.entries} note={calls.note} readOnly={readOnly} />
      <HomeownersSummary people={homeowners.people} more={homeowners.more} />
    </main>
  )
}
