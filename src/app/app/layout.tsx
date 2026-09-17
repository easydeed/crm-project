import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { TopBar } from '@/app/app/top-bar'
import { logoutAction } from '@/app/login/actions'
import { readRequestSession } from '@/auth/current-session'

export default async function AppLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await readRequestSession()
  if (!session) {
    redirect('/login?returnTo=/app')
  }

  return (
    <div className="min-h-screen">
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
