'use client'

import { useState } from 'react'
import { MessagesSquare, AlertCircle, Clock } from 'lucide-react'
import { useStore, BILLING } from '@/lib/store'
import type { Addon } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { BusinessForm } from '@/components/app/addon-business-form'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function AddonTexting({ addon }: { addon: Addon }) {
  const {
    textingStatus,
    setTextingStatus,
    businessInfo,
    setBusinessInfo,
    textsUsed,
  } = useStore()

  const [showForm, setShowForm] = useState(false)

  function handleToggle() {
    if (textingStatus === 'off' || textingStatus === 'rejected') {
      setShowForm(true)
    } else {
      setTextingStatus('off')
      setShowForm(false)
      toast.success('Text my clients turned off.')
    }
  }

  const on = textingStatus === 'active'
  const registering = textingStatus === 'registering'
  const over = Math.max(0, textsUsed - BILLING.textCap)
  const pct = Math.min(100, Math.round((textsUsed / BILLING.textCap) * 100))

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-lg',
            on ? 'bg-blue text-white' : 'bg-blue-soft text-blue',
          )}
        >
          <MessagesSquare className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <h3 className="text-[15px] font-[600] text-ink">{addon.title}</h3>
            <span className="text-[13px] font-[560] text-muted-foreground">
              {addon.price}
              {addon.unit}
            </span>
            {registering && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-soft px-2 py-0.5 text-[11.5px] font-[600] text-blue">
                <Clock className="size-3" aria-hidden />
                Registering
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">
            {addon.detail}
          </p>
        </div>
        <Switch
          checked={on}
          disabled={registering}
          aria-label={`Turn ${addon.title} ${on ? 'off' : 'on'}`}
          onCheckedChange={handleToggle}
        />
      </div>

      {registering && (
        <div className="mt-4 rounded-lg border border-blue/25 bg-blue-soft px-4 py-3">
          <p className="text-[13.5px] font-[600] text-ink">
            Registering with the carriers {'\u2014'} usually 3 to 5 days.
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Started September 1. We{'\u2019'}ll email you when it{'\u2019'}s live.
            You{'\u2019'}re not billed until then.
          </p>
        </div>
      )}

      {on && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-[13px] font-[540] text-ink">
            {over > 0 ? (
              <>
                {textsUsed} of {BILLING.textCap} used {'\u00b7'} {over} extra
                texts, ${((over * BILLING.overageCents) / 100).toFixed(2)} this
                month
              </>
            ) : (
              <>
                {textsUsed} of {BILLING.textCap} texts used this month {'\u00b7'}{' '}
                extra texts {BILLING.overageCents}
                {'\u00a2'}
              </>
            )}
          </p>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuenow={textsUsed}
            aria-valuemin={0}
            aria-valuemax={BILLING.textCap}
          >
            <div
              className={cn(
                'h-full rounded-full',
                over > 0 ? 'bg-coral' : 'bg-blue',
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {textingStatus === 'rejected' && (
        <div className="mt-4 rounded-lg border border-coral/30 bg-coral-soft px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-coral" aria-hidden />
            <div>
              <p className="text-[13.5px] font-[600] text-ink">
                The carriers didn{'\u2019'}t approve the registration.
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                This usually means the business details need a correction.
              </p>
              <div className="mt-2 flex gap-3 text-[13px] font-[560]">
                <button
                  onClick={() => setShowForm(true)}
                  className="text-blue underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                >
                  Review details
                </button>
                <span className="text-muted-foreground">{'\u00b7'}</span>
                <button
                  onClick={() => setTextingStatus('registering')}
                  className="text-blue underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <BusinessForm
          initial={businessInfo}
          onSubmit={(info) => {
            setBusinessInfo(info)
            setTextingStatus('registering')
            setShowForm(false)
            toast.success('Registration started.')
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Prototype state switcher — this add-on is the only one with four states */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-dashed border-line pt-3">
        <span className="mr-1 text-[11.5px] font-[560] uppercase tracking-[0.06em] text-muted-foreground">
          Prototype
        </span>
        {(['off', 'registering', 'active', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setShowForm(false)
              setTextingStatus(s)
            }}
            aria-pressed={textingStatus === s}
            className={cn(
              'rounded-full px-2.5 py-1 text-[12px] font-[560] capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue',
              textingStatus === s
                ? 'bg-ink text-white'
                : 'bg-surface text-muted-foreground hover:text-ink',
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
