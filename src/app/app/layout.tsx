import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { TopBar } from '@/app/app/top-bar'
import { ViewAsBanner } from '@/app/app/view-as-banner'
import { logoutAction } from '@/app/login/actions'
import { readRequestSession } from '@/auth/current-session'
import { getAccountById } from '@/db/accounts'

export default async function AppLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await readRequestSession()
  if (!session) {
    redirect('/login?returnTo=/app')
  }

  const viewed =
    session.viewingAsAccountId ? await getAccountById(session.viewingAsAccountId) : null

  return (
    <div className={`min-h-screen ${viewed ? 'pt-14' : ''}`}>
      {viewed ? <ViewAsBanner name={viewed.name} /> : null}
      <TopBar />
      <form action={logoutAction} className="px-4">
        <button
          className="text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          type="submit"
        >
          Log out
        </button>
      </form>
      {children}
    </div>
  )
}
