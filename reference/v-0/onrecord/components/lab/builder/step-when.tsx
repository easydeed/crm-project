'use client'

import { CalendarDays, Repeat, Zap } from 'lucide-react'
import type { StepProps, ScheduleKind } from './types'
import { TRIGGER_OPTIONS } from '@/lib/lab-data'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const KINDS: { id: ScheduleKind; icon: typeof Zap; label: string; hint: string }[] = [
  { id: 'onetime', icon: CalendarDays, label: 'One time', hint: 'Send once, on a date' },
  { id: 'recurring', icon: Repeat, label: 'Recurring', hint: 'Weekly or monthly' },
  { id: 'triggered', icon: Zap, label: 'Triggered', hint: 'When something happens' },
]

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function StepWhen({ draft, set }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-[640] text-ink">When does it go out?</h2>
        <p className="mt-0.5 text-[14px] text-muted-foreground">
          Texts only send 9am{'\u2013'}8pm in each person&apos;s local time, always.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {KINDS.map((k) => {
          const Icon = k.icon
          const active = draft.scheduleKind === k.id
          return (
            <button
              key={k.id}
              onClick={() => set({ scheduleKind: k.id })}
              aria-pressed={active}
              className={cn(
                'rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
                active ? 'border-blue bg-blue-soft' : 'border-line bg-white hover:border-blue/40',
              )}
            >
              <Icon className={cn('size-5', active ? 'text-blue' : 'text-muted-foreground')} aria-hidden />
              <p className="mt-2 text-[14.5px] font-[600] text-ink">{k.label}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{k.hint}</p>
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl border border-line bg-white p-4">
        {draft.scheduleKind === 'onetime' && (
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="send-date" className="text-[13px] font-[560] text-muted-foreground">Date</Label>
              <Input id="send-date" type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} className="h-10 w-44" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="send-time" className="text-[13px] font-[560] text-muted-foreground">Time</Label>
              <Input id="send-time" type="time" value={draft.time} onChange={(e) => set({ time: e.target.value })} className="h-10 w-32" />
            </div>
          </div>
        )}

        {draft.scheduleKind === 'recurring' && (
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit rounded-lg border border-line p-0.5">
              {(['weekly', 'monthly'] as const).map((fr) => (
                <button
                  key={fr}
                  onClick={() => set({ recurringFreq: fr })}
                  aria-pressed={draft.recurringFreq === fr}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-[13.5px] font-[540] capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
                    draft.recurringFreq === fr ? 'bg-ink text-white' : 'text-muted-foreground hover:text-ink',
                  )}
                >
                  {fr}
                </button>
              ))}
            </div>
            {draft.recurringFreq === 'weekly' ? (
              <div className="flex flex-wrap gap-1.5">
                {DOW.map((d) => (
                  <button
                    key={d}
                    onClick={() => set({ recurringDay: d })}
                    aria-pressed={draft.recurringDay === d}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-[13px] font-[540] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
                      draft.recurringDay === d ? 'border-blue bg-blue-soft text-blue' : 'border-line text-ink hover:border-blue/40',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dom" className="text-[13px] font-[560] text-muted-foreground">Day of month</Label>
                <select
                  id="dom"
                  value={draft.recurringDay}
                  onChange={(e) => set({ recurringDay: e.target.value })}
                  className="h-10 w-32 rounded-md border border-line bg-white px-2 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                >
                  {['1st', '5th', '10th', '15th', 'Last'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-time" className="text-[13px] font-[560] text-muted-foreground">Time</Label>
              <Input id="rec-time" type="time" value={draft.time} onChange={(e) => set({ time: e.target.value })} className="h-10 w-32" />
            </div>
          </div>
        )}

        {draft.scheduleKind === 'triggered' && (
          <div className="flex flex-col gap-2">
            <Label className="text-[13px] font-[560] text-muted-foreground">Send when{'\u2026'}</Label>
            <div className="flex flex-col gap-1.5">
              {TRIGGER_OPTIONS.map((t) => (
                <label
                  key={t}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[14px] transition-colors',
                    draft.trigger === t ? 'border-blue bg-blue-soft text-ink' : 'border-line text-ink hover:border-blue/40',
                  )}
                >
                  <input
                    type="radio"
                    name="trigger"
                    checked={draft.trigger === t}
                    onChange={() => set({ trigger: t })}
                    className="size-4 text-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                  />
                  When {t}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
