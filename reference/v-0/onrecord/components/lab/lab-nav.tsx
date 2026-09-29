'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/lab/campaigns', label: 'Campaigns' },
  { href: '/lab/templates', label: 'Templates' },
  { href: '/lab/audiences', label: 'Audiences' },
  { href: '/lab/automations', label: 'Automations' },
  { href: '/lab/plans', label: 'Plans' },
]

export function LabNav() {
  const pathname = usePathname()

  // The campaign builder is a full-screen flow with its own chrome.
  if (pathname === '/lab/campaigns/new') return null

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <Link
            href="/lab"
            className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            <span className="text-[17px] font-[680] tracking-[-0.02em] text-ink">
              onrecord
            </span>
          </Link>
          <span
            className="inline-flex items-center gap-1 rounded-md bg-coral-soft px-1.5 py-0.5 text-[11px] font-[680] uppercase tracking-[0.1em] text-coral"
            title={'Exploration build \u2014 not the shipped product'}
          >
            <FlaskConical className="size-3" aria-hidden />
            Lab
          </span>
        </div>

        <nav
          aria-label="Lab sections"
          className="flex items-center gap-0.5 overflow-x-auto sm:gap-1"
        >
          {NAV.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'shrink-0 rounded-lg px-2.5 py-2 text-[13.5px] font-[540] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 sm:px-3 sm:text-[14px]',
                  active
                    ? 'bg-blue-soft text-blue'
                    : 'text-muted-foreground hover:bg-surface hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Link
          href="/app"
          className="hidden shrink-0 rounded-lg border border-line px-3 py-2 text-[13.5px] font-[540] text-muted-foreground transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 md:block"
        >
          Back to app
        </Link>
      </div>
    </header>
  )
}

/** Section header used across lab screens; wider than the app default. */
export function LabHeader({
  title,
  subtitle,
  action,
  cost,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  cost?: string
}) {
  return (
    <div className="border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-5 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[22px] font-[680] tracking-[-0.02em] text-ink text-balance sm:text-[26px]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-0.5 text-[14px] text-muted-foreground text-pretty">
                {subtitle}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {cost ? (
          <p className="rounded-lg border border-dashed border-line bg-white px-3 py-2 text-[12.5px] leading-relaxed text-muted-foreground">
            <span className="font-[620] text-ink">If shipped: </span>
            {cost}
          </p>
        ) : null}
      </div>
    </div>
  )
}
