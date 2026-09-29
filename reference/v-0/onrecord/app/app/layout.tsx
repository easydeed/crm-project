import type { ReactNode } from 'react'
import { AppNav } from '@/components/app/app-nav'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-surface">
      <AppNav />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
