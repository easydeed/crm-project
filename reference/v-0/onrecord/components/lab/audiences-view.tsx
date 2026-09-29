'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/app/page-header'
import { useStore } from '@/lib/store'
import { useLabStore } from '@/components/lab/lab-store'
import {
  EMPTY_FILTER,
  ZIP_OPTIONS,
  filterContacts,
  filterChips,
  type AudienceFilter,
} from '@/lib/lab-audience'
import { Button } from '@/components/ui/button'
import { Users, Save, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function AudiencesView() {
  const { contacts } = useStore()
  const { savedSegments, saveSegment } = useLabStore()
  const [f, setF] = useState<AudienceFilter>(EMPTY_FILTER)

  const matched = useMemo(() => filterContacts(contacts, f), [contacts, f])
  const chips = filterChips(f)
  const pct = Math.round((matched.length / Math.max(contacts.length, 1)) * 100)
  const set = (p: Partial<AudienceFilter>) => setF((v) => ({ ...v, ...p }))

  return (
    <div>
      <PageHeader
        title="Audiences"
        subtitle="Build a segment from what the record knows — years owned, market gap, how they engage — and watch the count move."
      />

      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[300px_1fr]">
        {/* Filters */}
        <aside className="flex flex-col gap-5">
          <FilterGroup label="Owned for">
            {[null, 5, 10, 15].map((v) => (
              <Choice
                key={String(v)}
                active={f.ownedYears === v}
                onClick={() => set({ ownedYears: v })}
              >
                {v == null ? 'Any' : `${v}+ yrs`}
              </Choice>
            ))}
          </FilterGroup>

          <FilterGroup label="Market gap (value below street median)">
            {[null, 50000, 100000, 150000].map((v) => (
              <Choice
                key={String(v)}
                active={f.gapOver === v}
                onClick={() => set({ gapOver: v })}
              >
                {v == null ? 'Any' : `$${v / 1000}k+`}
              </Choice>
            ))}
          </FilterGroup>

          <FilterGroup label="Property type">
            {(['any', 'single', 'condo'] as const).map((v) => (
              <Choice
                key={v}
                active={f.propType === v}
                onClick={() => set({ propType: v })}
              >
                {v === 'any' ? 'Any' : v === 'single' ? 'Single-family' : 'Condo'}
              </Choice>
            ))}
          </FilterGroup>

          <FilterGroup label="ZIP">
            {ZIP_OPTIONS.map((z) => (
              <Choice key={z} active={f.zip === z} onClick={() => set({ zip: z })}>
                {z === 'any' ? 'Any' : z}
              </Choice>
            ))}
          </FilterGroup>

          <FilterGroup label="Not contacted in">
            {[null, 3, 6, 9].map((v) => (
              <Choice
                key={String(v)}
                active={f.noContactMonths === v}
                onClick={() => set({ noContactMonths: v })}
              >
                {v == null ? 'Any' : `${v}+ mo`}
              </Choice>
            ))}
          </FilterGroup>

          <label className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 py-2.5">
            <input
              type="checkbox"
              checked={f.openedLast3}
              onChange={(e) => set({ openedLast3: e.target.checked })}
              className="size-4 accent-blue"
            />
            <span className="text-[13.5px] text-ink">
              Opened one of the last 3 notes
            </span>
          </label>

          {chips.length > 0 && (
            <button
              onClick={() => setF(EMPTY_FILTER)}
              className="inline-flex items-center gap-1.5 self-start text-[13px] font-[560] text-muted-foreground hover:text-coral"
            >
              <X className="size-3.5" aria-hidden />
              Clear all
            </button>
          )}
        </aside>

        {/* Results */}
        <div className="flex flex-col gap-4">
          {/* Count card */}
          <div className="rounded-2xl border border-blue/25 bg-blue-soft/50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <Users className="size-5 self-center text-blue" aria-hidden />
                <span className="text-[34px] font-[720] tabular-nums leading-none text-ink">
                  {matched.length}
                </span>
                <span className="text-[14px] font-[560] text-muted-foreground">
                  of {contacts.length} people {'\u00b7'} {pct}%
                </span>
              </div>
              <Button
                onClick={() => {
                  saveSegment({
                    name:
                      chips.length > 0
                        ? chips.slice(0, 2).join(', ')
                        : 'Everyone',
                    count: matched.length,
                    chips,
                  })
                  toast.success('Segment saved. It shows up in the builder.')
                }}
                className="h-9 gap-1.5 bg-blue text-[13px] font-[600] text-white hover:bg-blue/90"
              >
                <Save className="size-3.5" aria-hidden />
                Save segment
              </Button>
            </div>
            {chips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {chips.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-white px-2.5 py-0.5 text-[12px] font-[540] text-ink"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Saved segments */}
          {savedSegments.length > 0 && (
            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="mb-2 text-[12px] font-[620] uppercase tracking-[0.1em] text-muted-foreground">
                Saved segments
              </p>
              <ul className="flex flex-col gap-1.5">
                {savedSegments.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg bg-surface px-3 py-2"
                  >
                    <span className="text-[13.5px] font-[540] text-ink">
                      {s.name}
                    </span>
                    <span className="text-[12.5px] text-muted-foreground">
                      {s.count} people
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* People preview */}
          <div className="rounded-2xl border border-line bg-white">
            <div className="border-b border-line px-4 py-2.5 text-[12px] font-[560] uppercase tracking-[0.08em] text-muted-foreground">
              Who{'\u2019'}s in it
            </div>
            <ul className="divide-y divide-line">
              {matched.slice(0, 40).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/lab/people/${c.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-[560] text-ink">
                        {c.name}
                      </p>
                      <p className="truncate text-[12.5px] text-muted-foreground">
                        {c.address}, {c.city}
                      </p>
                    </div>
                    <ChevronRight
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
              {matched.length === 0 && (
                <li className="px-4 py-10 text-center text-[13.5px] text-muted-foreground">
                  Nobody matches yet. Loosen a filter.
                </li>
              )}
            </ul>
            {matched.length > 40 && (
              <div className="border-t border-line px-4 py-2.5 text-center text-[12.5px] text-muted-foreground">
                +{matched.length - 40} more
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-1.5 text-[12.5px] font-[560] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg border px-2.5 py-1.5 text-[13px] font-[540] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
        active
          ? 'border-blue bg-blue text-white'
          : 'border-line bg-white text-ink hover:border-blue/40',
      )}
    >
      {children}
    </button>
  )
}
