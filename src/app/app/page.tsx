import { redirect } from 'next/navigation'
import { HomeSendCard } from '@/app/app/home-card'
import { loadHomeSend } from '@/app/app/home-send'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'

export default async function AppHomePage() {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app')

  const view = await loadHomeSend(effectiveAccountId(session))
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

  return <HomeSendCard readOnly={Boolean(session.viewingAsAccountId)} view={view} />
}
