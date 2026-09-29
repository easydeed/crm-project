'use client'

import { useState } from 'react'
import { Users, SlidersHorizontal, MapPin, ArrowRight } from 'lucide-react'
import type { StepProps, AudienceMode } from './types'
import { AudienceDrawer } from './audience-drawer'
import { EMPTY_FILTER, ZIP_OPTIONS } from '@/lib/lab-audience'
import { useStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const MODES: { id: AudienceMode; icon: typeof Users; label: string; hint: string }[] = [
  { id: 'group', icon: Users, label: 'A saved group', hint: 'People you\u2019ve already grouped' },
  { id: 'filter', icon: SlidersHorizontal, label: 'Build a filter', hint: 'By the record and how they read' },
  { id: 'farm', icon: MapPin, label: 'A farm area', hint: 'A street, known or not' },
]

export function StepWho({ draft, set, audienceCount }: StepProps) {
  const { groups, contacts, farmStreet } = useStore()
  const [drawer, setDrawer] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-[640] text-ink">Who should get this?</h2>
        <p className="mt-0.5 text-[14px] text-muted-foreground">
          Pick one way to choose. The count updates as you go.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {MODES.map((m) => {
          const Icon = m.icon
          const active = draft.audienceMode === m.id
          return (
            <button
              key={m.id}
              onClick={() => set({ audienceMode: m.id })}
              aria-pressed={active}
              className={cn(
                'rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
                active ? 'border-blue bg-blue-soft' : 'border-line bg-white hover:border-blue/40',
              )}
            >
              <Icon className={cn('size-5', active ? 'text-blue' : 'text-muted-foreground')} aria-hidden />
              <p className="mt-2 text-[14.5px] font-[600] text-ink">{m.label}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{m.hint}</p>
            </button>
          )
        })}
      </div>

      {/* mode body */}
      <div className="rounded-2xl border border-line bg-white p-4">
        {draft.audienceMode === 'group' && (
          <div className="flex flex-col gap-2">
            <Label className="text-[13px] font-[560] text-muted-foreground">Choose a group</Label>
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => {
                const count = contacts.filter((c) => c.groups.includes(g)).length
                const active = draft.groupId === g
                return (
                  <button
                    key={g}
                    onClick={() => set({ groupId: g })}
                    aria-pressed={active}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-[13.5px] font-[540] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
                      active ? 'border-blue bg-blue-soft text-blue' : 'border-line text-ink hover:border-blue/40',
                    )}
                  >
                    {g} <span className="tabular-nums text-muted-foreground">({count})</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {draft.audienceMode === 'filter' && (
          <FilterBuilder draft={draft} set={set} />
        )}

        {draft.audienceMode === 'farm' && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="farm-street" className="text-[13px] font-[560] text-muted-foreground">
              Which street?
            </Label>
            <Input
              id="farm-street"
              value={draft.farmStreet}
              onChange={(e) => set({ farmStreet: e.target.value })}
              placeholder={farmStreet}
              className="h-10 max-w-xs"
            />
            <p className="text-[13px] text-muted-foreground">
              Everyone on it gets the note, whether or not they know you yet.
            </p>
          </div>
        )}
      </div>

      {/* live count */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue/30 bg-blue-soft px-4 py-3">
        <p className="text-[15px] text-ink">
          <span className="text-[22px] font-[680] tabular-nums text-blue">{audienceCount}</span>{' '}
          {audienceCount === 1 ? 'person' : 'people'} match right now
        </p>
        <button
          onClick={() => setDrawer(true)}
          className="inline-flex items-center gap-1 text-[13.5px] font-[560] text-blue underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
        >
          Preview these {audienceCount} people
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>

      <AudienceDrawer open={drawer} onClose={() => setDrawer(false)} draft={draft} />
    </div>
  )
}

function FilterBuilder({ draft, set }: Pick<StepProps, 'draft' | 'set'>) {
  const f = draft.filter
  const patch = (p: Partial<typeof f>) => set({ filter: { ...f, ...p } })

  return (
    <div className="flex flex-col gap-3">
      <Toggle
        label="Owned more than"
        on={f.ownedYears != null}
        onToggle={(on) => patch({ ownedYears: on ? 15 : null })}
      >
        <NumberPick value={f.ownedYears ?? 15} options={[5, 10, 15, 20]} suffix="years" onPick={(v) => patch({ ownedYears: v })} />
      </Toggle>

      <Toggle
        label="Assessed-to-market gap over"
        on={f.gapOver != null}
        onToggle={(on) => patch({ gapOver: on ? 200000 : null })}
      >
        <NumberPick value={f.gapOver ?? 200000} options={[100000, 200000, 300000]} format={(v) => `$${v / 1000}k`} onPick={(v) => patch({ gapOver: v })} />
      </Toggle>

      <Toggle label="Opened the last 3 notes" on={f.openedLast3} onToggle={(on) => patch({ openedLast3: on })} />

      <Toggle
        label="No contact in"
        on={f.noContactMonths != null}
        onToggle={(on) => patch({ noContactMonths: on ? 6 : null })}
      >
        <NumberPick value={f.noContactMonths ?? 6} options={[3, 6, 12]} suffix="months" onPick={(v) => patch({ noContactMonths: v })} />
      </Toggle>

      <div className="flex flex-wrap gap-4 pt-1">
        <label className="flex items-center gap-2 text-[13.5px] text-ink">
          <span className="text-muted-foreground">ZIP</span>
          <select
            value={f.zip}
            onChange={(e) => patch({ zip: e.target.value })}
            className="h-8 rounded-md border border-line bg-white px-2 text-[13.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          >
            {ZIP_OPTIONS.map((z) => (
              <option key={z} value={z}>{z === 'any' ? 'Any' : z}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[13.5px] text-ink">
          <span className="text-muted-foreground">Type</span>
          <select
            value={f.propType}
            onChange={(e) => patch({ propType: e.target.value as typeof f.propType })}
            className="h-8 rounded-md border border-line bg-white px-2 text-[13.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          >
            <option value="any">Any</option>
            <option value="single">Single-family</option>
            <option value="condo">Condo</option>
          </select>
        </label>
        <button
          onClick={() => set({ filter: { ...EMPTY_FILTER } })}
          className="ml-auto text-[13px] text-muted-foreground underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
        >
          Clear filters
        </button>
      </div>
    </div>
  )
}

function Toggle({
  label,
  on,
  onToggle,
  children,
}: {
  label: string
  on: boolean
  onToggle: (on: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-[14px] text-ink">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => onToggle(e.target.checked)}
          className="size-4 rounded border-line text-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
        />
        {label}
      </label>
      {on && children}
    </div>
  )
}

function NumberPick({
  value,
  options,
  suffix,
  format,
  onPick,
}: {
  value: number
  options: number[]
  suffix?: string
  format?: (v: number) => string
  onPick: (v: number) => void
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-line">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onPick(o)}
          aria-pressed={value === o}
          className={cn(
            'px-2.5 py-1 text-[13px] font-[540] tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
            value === o ? 'bg-ink text-white' : 'bg-white text-muted-foreground hover:text-ink',
          )}
        >
          {format ? format(o) : `${o}${suffix ? ` ${suffix}` : ''}`}
        </button>
      ))}
    </div>
  )
}
