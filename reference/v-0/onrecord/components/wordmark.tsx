import { cn } from '@/lib/utils'
import Link from 'next/link'

export function Wordmark({
  className,
  href = '/',
}: {
  className?: string
  href?: string
}) {
  return (
    <Link
      href={href}
      aria-label="onrecord"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md text-[17px] font-[680] tracking-[-0.03em] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-6 place-items-center rounded-[7px] bg-blue text-[13px] font-[680] text-white"
      >
        o
      </span>
      <span aria-hidden="true" className="-ml-0.5">nrecord</span>
    </Link>
  )
}
