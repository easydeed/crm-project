import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { TopBar } from '@/app/app/top-bar'
import { ViewAsBanner } from '@/app/app/view-as-banner'
import { logoutAction } from '@/app/login/actions'
import { readRequestSession } from '@/auth/current-session'
import { getAccountById } from '@/db/accounts'
import { metaLinkClass, mutedClass } from '@/app/app/people/ui'

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

  // The identity line names the account whose data is on screen: the viewed one in view-as.
  const shown = viewed ?? (await getAccountById(session.accountId))

  return (
    <div className="min-h-screen">
      {viewed ? <ViewAsBanner name={viewed.name} /> : null}
      <TopBar />
      <div className="flex items-center justify-between gap-3 border-b border-rule px-4">
        <p className={mutedClass}>
          {shown?.name}
          {shown?.brokerage ? ` · ${shown.brokerage}` : null}
        </p>
        <form action={logoutAction}>
          <button className={`${metaLinkClass} min-h-11`} type="submit">
            Log out
          </button>
        </form>
      </div>
      {children}
    </div>
  )
}
