'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wordmark } from '@/components/wordmark'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/app/people', label: 'People' },
  { href: '/app/addons', label: 'Add-ons' },
  { href: '/app/settings', label: 'Settings' },
]

export function AppNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5 sm:px-8">
        <Wordmark href="/app" />
        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
          {NAV.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3 py-2 text-[14px] font-[540] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2',
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
      </div>
    </header>
  )
}
