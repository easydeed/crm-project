'use client'

import { useEffect, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LotCard } from '@/components/match/lot-card'
import type { Candidate } from '@/lib/candidates'

export function MatchFlow({
  query,
  candidates,
  onConfirm,
  onNoneMatch,
  confirmLabel = 'This is the one',
  autoSelectFirst = true,
}: {
  query: string
  candidates: Candidate[]
  onConfirm: (candidate: Candidate) => void
  onNoneMatch?: () => void
  confirmLabel?: string
  autoSelectFirst?: boolean
}) {
  const [phase, setPhase] = useState<'searching' | 'results'>('searching')
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    setPhase('searching')
    setSelected(null)
    const t = setTimeout(() => {
      setPhase('results')
      if (autoSelectFirst && candidates[0]) setSelected(candidates[0].apn)
    }, 1300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  if (phase === 'searching') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-white py-16 text-center">
        <Loader2 className="size-5 animate-spin text-blue" aria-hidden />
        <p className="text-[15px] font-[560] text-ink">
          Searching county parcels
        </p>
        <p className="max-w-xs text-pretty text-[13px] text-muted-foreground">
          Matching {'\u201C'}
          {query}
          {'\u201D'} against recorded deeds.
        </p>
      </div>
    )
  }

  const chosen = candidates.find((c) => c.apn === selected) ?? null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <MapPin className="size-4 text-blue" aria-hidden />
        {candidates.length} possible {candidates.length === 1 ? 'parcel' : 'parcels'} near{' '}
        <span className="font-[560] text-ink">{query}</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {candidates.map((c) => (
          <LotCard
            key={c.apn}
            candidate={c}
            selected={selected === c.apn}
            onSelect={() => setSelected(c.apn)}
          />
        ))}
      </div>

      <div className="mt-1 flex flex-col gap-2">
        <Button
          size="lg"
          disabled={!chosen}
          onClick={() => chosen && onConfirm(chosen)}
          className="h-12 bg-blue text-[15px] font-[620] text-white [&:hover]:bg-blue/90"
        >
          {confirmLabel}
        </Button>
        {onNoneMatch ? (
          <button
            type="button"
            onClick={onNoneMatch}
            className="text-[13px] text-muted-foreground underline underline-offset-2 hover:text-ink"
          >
            None of these are mine
          </button>
        ) : null}
      </div>
    </div>
  )
}
