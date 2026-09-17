import type { ReactNode } from 'react'
import { notFound, redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await readRequestSession()
  if (!session) {
    redirect('/login?returnTo=/admin')
  }
  if (session.viewingAsAccountId) {
    redirect('/app')
  }
  if (session.role !== 'admin') {
    notFound()
  }
  return children
}
