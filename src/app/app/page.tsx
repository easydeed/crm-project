import { redirect } from 'next/navigation'
import { CallListSection } from '@/app/app/call-list'
import { loadCallList } from '@/app/app/call-list-data'
import { HomeSendCard } from '@/app/app/home-card'
import { loadHomeSend } from '@/app/app/home-send'
import { HomeownersSection } from '@/app/app/homeowners-section'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { loadTextNotice } from '@/text/text-notice'

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
  const textNotice = await loadTextNotice(accountId)
  const readOnly = Boolean(session.viewingAsAccountId)
  return (
    <main className="px-4 pb-10 pt-5 sm:px-8 sm:pb-16 sm:pt-7">
      {/* The dashboard's column (OR-044): 760px, this screen only. */}
      <div className="flex max-w-[760px] flex-col gap-5 sm:gap-6">
        <HomeSendCard readOnly={readOnly} view={view} />
        <CallListSection list={list} readOnly={readOnly} textNotice={textNotice} />
        <HomeownersSection />
      </div>
    </main>
  )
}
