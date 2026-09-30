'use client'

import { Check } from 'lucide-react'
import type { Candidate } from '@/lib/candidates'
import { cn } from '@/lib/utils'

export function LotCard({
  candidate,
  selected,
  onSelect,
}: {
  candidate: Candidate
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-start justify-between gap-4 rounded-xl border bg-white p-4 text-left transition-colors',
        selected
          ? 'border-blue ring-2 ring-blue/20'
          : 'border-line hover:border-blue/40',
      )}
    >
      <div className="min-w-0">
        <p className="text-[15px] font-[560] text-ink">{candidate.address}</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Owner of record: {candidate.owner}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-muted-foreground tabular-nums">
          <span>APN {candidate.apn}</span>
          <span>{candidate.lastDeed}</span>
        </div>
      </div>
      <span
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
          selected
            ? 'border-blue bg-blue text-white'
            : 'border-line text-transparent',
        )}
        aria-hidden
      >
        <Check className="size-3.5" />
      </span>
    </button>
  )
}
