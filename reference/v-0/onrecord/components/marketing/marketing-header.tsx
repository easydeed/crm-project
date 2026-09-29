'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wordmark } from '@/components/wordmark'
import { Button } from '@/components/ui/button'

const NAV_LINKS = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Add-ons', href: '/#add-ons' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Sample', href: '/sample' },
]

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-line bg-white/90 shadow-[0_1px_20px_-8px_rgba(15,32,66,0.25)] backdrop-blur-md'
          : 'border-b border-transparent bg-white/60 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Wordmark />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-[14px] font-[540] text-muted-foreground transition-colors hover:bg-blue-soft/60 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-md px-3 py-2 text-[14px] font-[540] text-muted-foreground transition-colors hover:text-ink sm:inline-block"
          >
            Log in
          </Link>
          <Button
            nativeButton={false}
            render={<Link href="/register" />}
            className="h-9 bg-blue px-4 text-[14px] font-[560] text-white shadow-sm transition-all [a]:hover:bg-blue/90 [a]:hover:shadow-md"
          >
            Start for $19
          </Button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-md text-ink transition-colors hover:bg-blue-soft/60 md:hidden"
          >
            <span className="relative flex h-4 w-5 flex-col justify-between">
              <span
                className={`h-0.5 w-full rounded-full bg-current transition-all duration-300 ${open ? 'translate-y-[7px] rotate-45' : ''}`}
              />
              <span
                className={`h-0.5 w-full rounded-full bg-current transition-all duration-200 ${open ? 'opacity-0' : ''}`}
              />
              <span
                className={`h-0.5 w-full rounded-full bg-current transition-all duration-300 ${open ? '-translate-y-[7px] -rotate-45' : ''}`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden border-t border-line bg-white/95 backdrop-blur-md transition-[max-height,opacity] duration-300 md:hidden ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-[15px] font-[540] text-ink transition-colors hover:bg-blue-soft/60"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2.5 text-[15px] font-[540] text-muted-foreground transition-colors hover:bg-blue-soft/60"
          >
            Log in
          </Link>
        </nav>
      </div>
    </header>
  )
}
