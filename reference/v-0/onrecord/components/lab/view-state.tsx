'use client'

import type { ReactNode } from 'react'
import { AlertCircle, Inbox } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ScreenState = 'loading' | 'empty' | 'error' | 'data'

const STATES: { id: ScreenState; label: string }[] = [
  { id: 'data', label: 'Populated' },
  { id: 'loading', label: 'Loading' },
  { id: 'empty', label: 'Empty' },
  { id: 'error', label: 'Error' },
]

/**
 * A small segmented control that lets a reviewer flip a screen through its
 * four states. This is a prototype affordance, labelled as such.
 */
export function StateSwitcher({
  value,
  onChange,
  className,
}: {
  value: ScreenState
  onChange: (s: ScreenState) => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-end gap-1', className)}>
      <span className="text-[11px] font-[560] uppercase tracking-[0.08em] text-muted-foreground">
        Prototype state
      </span>
      <div
        role="group"
        aria-label="Preview screen state"
        className="inline-flex rounded-lg border border-line bg-white p-0.5"
      >
        {STATES.map((s) => {
          const active = value === s.id
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              aria-pressed={active}
              className={cn(
                'rounded-md px-2.5 py-1 text-[12.5px] font-[540] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
                active
                  ? 'bg-blue text-white'
                  : 'text-muted-foreground hover:text-ink',
              )}
            >
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ViewState({
  state,
  emptyTitle,
  emptyBody,
  emptyAction,
  onRetry,
  skeleton,
  children,
}: {
  state: ScreenState
  emptyTitle: string
  emptyBody: string
  emptyAction?: ReactNode
  onRetry?: () => void
  skeleton?: ReactNode
  children: ReactNode
}) {
  if (state === 'loading') {
    return (
      <div aria-busy="true" aria-live="polite">
        {skeleton ?? <DefaultSkeleton />}
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="grid place-items-center rounded-2xl border border-line bg-white px-6 py-16 text-center">
        <div className="grid size-11 place-items-center rounded-full bg-coral-soft text-coral">
          <AlertCircle className="size-5" aria-hidden />
        </div>
        <h2 className="mt-4 text-[17px] font-[620] text-ink">
          We couldn&apos;t load this
        </h2>
        <p className="mt-1 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
          Something went wrong reading the county feed. Your data is safe {'\u2014'}{' '}
          this is only the view.
        </p>
        <Button onClick={onRetry} className="mt-5 h-9">
          Try again
        </Button>
      </div>
    )
  }

  if (state === 'empty') {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
        <div className="grid size-11 place-items-center rounded-full bg-surface text-muted-foreground">
          <Inbox className="size-5" aria-hidden />
        </div>
        <h2 className="mt-4 text-[17px] font-[620] text-ink">{emptyTitle}</h2>
        <p className="mt-1 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
          {emptyBody}
        </p>
        {emptyAction ? <div className="mt-5">{emptyAction}</div> : null}
      </div>
    )
  }

  return <>{children}</>
}

function DefaultSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4"
        >
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="mt-2 h-3 w-64" />
          </div>
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      ))}
    </div>
  )
}
