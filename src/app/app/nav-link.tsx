'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const shape =
  'tap whitespace-nowrap rounded-md px-3 py-2 text-[16px] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-bar'

/** On the bar (OR-043). The current page is the light pill on the dark bar, in both themes. Each look names one text colour. */
const restClass = `${shape} font-medium text-on-bar`
const currentClass = `${shape} bg-blue-soft font-semibold text-foreground`

/**
 * A top-bar link that knows whether it is the current page. It reads the pathname and nothing
 * else: the href and label are fixed strings from the server-rendered bar.
 */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname()
  const current = pathname === href || pathname.startsWith(`${href}/`)
  return (
    <Link
      aria-current={current ? 'page' : undefined}
      className={current ? currentClass : restClass}
      href={href}
    >
      {children}
    </Link>
  )
}
