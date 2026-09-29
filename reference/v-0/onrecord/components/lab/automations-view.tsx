'use client'

import { PageHeader } from '@/components/app/page-header'
import { useLabStore } from '@/components/lab/lab-store'
import { CHANNEL_META } from '@/lib/lab-data'
import { Switch } from '@/components/ui/switch'
import { Zap, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function AutomationsView() {
  const { automations, toggleAutomation } = useLabStore()
  const activeCount = automations.filter((a) => a.on).length
  const totalRuns = automations.reduce((s, a) => s + a.runs, 0)

  return (
    <div>
      <PageHeader
        title="Automations"
        subtitle={
          'These watch the county record for you. When something changes at a client\u2019s home, the right note goes out on its own.'
        }
      />

      <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
        {/* Summary */}
        <div className="mb-5 flex flex-wrap gap-3">
          <Stat value={activeCount} label="running now" />
          <Stat value={totalRuns} label="notes sent this way" />
          <Stat value={automations.length} label="available" />
        </div>

        <div className="flex flex-col gap-3">
          {automations.map((a) => {
            const Chan = CHANNEL_META[a.channel].icon
            return (
              <div
                key={a.id}
                className={cn(
                  'rounded-2xl border p-5 transition-colors',
                  a.on
                    ? 'border-blue/30 bg-white'
                    : 'border-line bg-surface/50',
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'grid size-9 shrink-0 place-items-center rounded-lg',
                        a.on
                          ? 'bg-blue text-white'
                          : 'bg-line/60 text-muted-foreground',
                      )}
                    >
                      <Zap className="size-4" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-[560] text-muted-foreground">
                        When {a.trigger}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-[15px] font-[620] leading-snug text-ink text-pretty">
                        <ArrowRight
                          className="size-4 shrink-0 text-blue"
                          aria-hidden
                        />
                        {a.template}
                      </p>
                      <p className="mt-1.5 flex items-center gap-2 text-[12.5px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5">
                          <Chan className="size-3" aria-hidden />
                          {CHANNEL_META[a.channel].label}
                        </span>
                        <span>to {a.target}</span>
                        <span aria-hidden>{'\u00b7'}</span>
                        <span>{a.runs} sent</span>
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={a.on}
                    onCheckedChange={() => {
                      toggleAutomation(a.id)
                      toast.success(
                        a.on ? 'Automation paused.' : 'Automation on.',
                      )
                    }}
                    aria-label={`Turn ${a.template} ${a.on ? 'off' : 'on'}`}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-6 rounded-xl border border-line bg-white px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
          Automations only ever send to the person the record is about {'\u2014'}{' '}
          never the whole list. That{'\u2019'}s the difference between timely and
          spammy.
        </p>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex-1 rounded-xl border border-line bg-white px-4 py-3">
      <p className="text-[22px] font-[700] tabular-nums text-ink">{value}</p>
      <p className="text-[12.5px] text-muted-foreground">{label}</p>
    </div>
  )
}
