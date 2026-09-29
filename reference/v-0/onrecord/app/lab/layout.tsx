import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { LabNav } from '@/components/lab/lab-nav'
import { LabStoreProvider } from '@/components/lab/lab-store'

export const metadata: Metadata = {
  title: 'onrecord — Lab',
  description:
    'An exploration build of onrecord: campaigns, templates, audiences, and the full client record. Not the shipped product.',
}

export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <LabStoreProvider>
      <div className="min-h-dvh bg-surface">
        <LabNav />
        {children}
      </div>
    </LabStoreProvider>
  )
}
