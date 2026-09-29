'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wordmark } from '@/components/wordmark'
import { Button } from '@/components/ui/button'
import { StepWho } from './step-who'
import { StepWhat } from './step-what'
import { StepWhen } from './step-when'
import { StepReview } from './step-review'
import { EMPTY_DRAFT, type Draft } from './types'
import { useAudience, audienceLabel } from './use-audience'
import { useLabStore } from '@/components/lab/lab-store'
import { Check, ArrowLeft, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const STEPS = [
  { key: 'who', label: 'Who' },
  { key: 'what', label: 'What' },
  { key: 'when', label: 'When' },
  { key: 'review', label: 'Review' },
] as const

export function CampaignBuilder() {
  const router = useRouter()
  const { addCampaign } = useLabStore()
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)

  const audience = useAudience(draft)
  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }))

  const canAdvance = useMemo(() => {
    if (stepIndex === 0) return audience.count > 0
    if (stepIndex === 1) return draft.body.trim().length > 0
    return true
  }, [stepIndex, audience.count, draft.body])

  const step = STEPS[stepIndex].key

  function launch() {
    const scheduleLabel =
      draft.scheduleKind === 'onetime'
        ? draft.date
          ? `Once on ${draft.date}`
          : 'Once, right away'
        : draft.scheduleKind === 'recurring'
          ? draft.recurringFreq === 'monthly'
            ? `Monthly, day ${draft.recurringDay}`
            : 'Weekly'
          : 'When the record changes'
    addCampaign({
      name: draft.name || draft.templateName || 'Untitled campaign',
      channel: draft.channel,
      status: 'draft',
      audienceName: audienceLabel(draft, 'My Sphere'),
      audienceCount: audience.count,
      schedule: scheduleLabel,
      templateId: draft.templateId ?? undefined,
    })
    toast.success('Campaign saved to your drafts.')
    setTimeout(() => router.push('/lab/campaigns'), 600)
  }

  return (
    <div className="min-h-svh bg-surface">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white/85 px-5 backdrop-blur-md sm:px-8">
        <Wordmark href="/lab/campaigns" />
        <button
          onClick={() => router.push('/lab/campaigns')}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-[560] text-muted-foreground hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
        >
          <X className="size-4" aria-hidden />
          Close
        </button>
      </header>

      {/* Stepper */}
      <div className="border-b border-line bg-white">
        <ol className="mx-auto flex max-w-3xl items-center gap-2 px-5 py-4 sm:px-8">
          {STEPS.map((s, i) => {
            const done = i < stepIndex
            const active = i === stepIndex
            return (
              <li key={s.key} className="flex flex-1 items-center gap-2">
                <button
                  onClick={() => i <= stepIndex && setStepIndex(i)}
                  disabled={i > stepIndex}
                  className={cn(
                    'flex items-center gap-2 rounded-full text-[13px] font-[600] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
                    i > stepIndex && 'cursor-default',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-6 shrink-0 place-items-center rounded-full text-[12px]',
                      active && 'bg-blue text-white',
                      done && 'bg-blue/15 text-blue',
                      !active && !done && 'bg-surface text-muted-foreground',
                    )}
                  >
                    {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      active ? 'text-ink' : 'text-muted-foreground',
                      'hidden sm:inline',
                    )}
                  >
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className={cn(
                      'h-px flex-1',
                      done ? 'bg-blue/30' : 'bg-line',
                    )}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </div>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        {step === 'who' && (
          <StepWho draft={draft} set={patch} audienceCount={audience.count} />
        )}
        {step === 'what' && (
          <StepWhat draft={draft} set={patch} audienceCount={audience.count} />
        )}
        {step === 'when' && (
          <StepWhen draft={draft} set={patch} audienceCount={audience.count} />
        )}
        {step === 'review' && (
          <StepReview
            draft={draft}
            set={patch}
            audienceCount={audience.count}
          />
        )}
      </main>

      {/* Footer nav */}
      <div className="sticky bottom-0 border-t border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3 sm:px-8">
          <Button
            variant="ghost"
            onClick={() => (stepIndex === 0 ? router.push('/lab/campaigns') : setStepIndex((i) => i - 1))}
            className="h-10 gap-1.5 text-[14px] font-[560] text-muted-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Button>
          {step === 'review' ? (
            <Button
              onClick={launch}
              className="h-10 gap-1.5 bg-blue px-5 text-[14px] font-[620] text-white hover:bg-blue/90"
            >
              <Check className="size-4" aria-hidden />
              Save campaign
            </Button>
          ) : (
            <Button
              onClick={() => canAdvance && setStepIndex((i) => i + 1)}
              disabled={!canAdvance}
              className="h-10 gap-1.5 bg-blue px-5 text-[14px] font-[620] text-white hover:bg-blue/90 disabled:opacity-40"
            >
              Continue
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
