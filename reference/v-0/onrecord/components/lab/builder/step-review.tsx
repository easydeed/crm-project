'use client'

import { Check, Lock, ArrowRight } from 'lucide-react'
import type { StepProps } from './types'
import { audienceLabel } from './use-audience'
import { scheduleSummary } from './schedule-summary'
import { useLab } from '@/components/lab/lab-store'
import { CHANNEL_META } from '@/lib/lab-data'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function StepReview({ draft, audienceCount }: StepProps) {
  const { planItems, togglePlanItem } = useLab()

  const channel = CHANNEL_META[draft.channel]
  const schedule = scheduleSummary(draft)

  // estimated cost for this campaign
  const smsEst = draft.channel === 'sms' ? audienceCount * 0.013 : 0
  const estLabel =
    draft.channel === 'sms'
      ? `~$${smsEst.toFixed(2)} per send (${audienceCount} texts \u00d7 ~1.3\u00a2)`
      : 'No per-send cost \u2014 email is included'

  // which add-on this campaign needs
  const needed =
    draft.channel === 'sms'
      ? planItems.find((p) => p.id === 'p-text-clients')
      : planItems.find((p) => p.id === 'p-campaigns')
  const needsUpgrade = needed && !needed.on

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-[640] text-ink">Look it over</h2>
        <p className="mt-0.5 text-[14px] text-muted-foreground">
          Nothing sends until you make it live.
        </p>
      </div>

      <dl className="overflow-hidden rounded-2xl border border-line bg-white">
        <Row label="Audience">
          {audienceLabel(draft, 'a group')}{' '}
          <span className="tabular-nums text-muted-foreground">
            {'\u00b7'} {audienceCount} {audienceCount === 1 ? 'person' : 'people'}
          </span>
        </Row>
        <Row label="Channel">{channel.label}</Row>
        <Row label="First send">{schedule}</Row>
        <Row label="Estimated cost">{estLabel}</Row>
      </dl>

      {needsUpgrade ? (
        <div className="rounded-2xl border border-coral/40 bg-coral-soft/60 p-4">
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-coral">
              <Lock className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-[600] text-ink">
                This needs {needed!.name} {'\u2014'} ${needed!.price}
                {needed!.unit}
              </p>
              <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">
                {draft.channel === 'sms'
                  ? 'Texting consumers requires a registered add-on. You can still save this as a draft.'
                  : 'The campaign builder is a premium add-on. You can still save this as a draft.'}
              </p>
              <Button
                onClick={() => togglePlanItem(needed!.id)}
                className="mt-3 h-9"
              >
                Turn on {needed!.name}
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-[13.5px] text-ink">
          <span className="grid size-6 place-items-center rounded-full bg-[#e7f6ef] text-green">
            <Check className="size-3.5" aria-hidden />
          </span>
          Your plan covers this campaign.
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4 border-b border-line px-4 py-3 last:border-0')}>
      <dt className="text-[13.5px] text-muted-foreground">{label}</dt>
      <dd className="text-right text-[14.5px] font-[560] text-ink">{children}</dd>
    </div>
  )
}
