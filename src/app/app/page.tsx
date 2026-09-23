import { redirect } from 'next/navigation'
import { CallListSection } from '@/app/app/call-list'
import { loadCallList } from '@/app/app/call-list-data'
import { HomeSendCard } from '@/app/app/home-card'
import { loadHomeSend } from '@/app/app/home-send'
import { HomeownersSection } from '@/app/app/homeowners-section'
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

  // Order is fixed: send status, then the call list, then homeowners. Nothing else.
  const list = await loadCallList(accountId)
  return (
    <main>
      <HomeSendCard readOnly={Boolean(session.viewingAsAccountId)} view={view} />
      <CallListSection list={list} />
      <HomeownersSection />
    </main>
  )
}
