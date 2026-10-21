'use client'

import { useState } from 'react'
import { formatDollars } from '@/config/costs'
import { cardTitleClass, eyebrowClass, headingClass } from '@/app/marketing/ui'

type AddonRow = { key: string; title: string; blurb: string; priceCents: number; price: string }

/** The two add-ons the app sells. Each row is a switch, and the total is the plan plus whatever is on. */
export function AddonSwitches({ addons, baseCents }: { addons: AddonRow[]; baseCents: number }) {
  const [on, setOn] = useState<Record<string, boolean>>({})
  const extra = addons.reduce((sum, addon) => sum + (on[addon.key] ? addon.priceCents : 0), 0)
  return (
    <section className="bg-mkt-white text-mkt-navy">
      <div className="mx-auto grid w-full max-w-[1280px] items-start gap-12 px-[clamp(20px,4vw,48px)] py-[clamp(64px,9vw,112px)] lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <p className={`${eyebrowClass} text-mkt-secondary`}>Add-ons</p>
          <h2 className={headingClass}>Flip a switch. That&apos;s it.</h2>
          <p className="max-w-[440px] text-[19px] leading-normal font-medium text-mkt-body">
            All start off. Turn one on when you want it, off the month you don&apos;t.
          </p>
          <div className="mt-3 flex max-w-[440px] items-baseline gap-3.5 border-t-2 border-mkt-navy pt-[18px]">
            <span className="text-[15px] font-extrabold tracking-[0.08em] uppercase">Your month</span>
            <span aria-live="polite" aria-atomic="true" className="ml-auto text-[64px] leading-[0.9] font-black tracking-[-0.025em]">
              {formatDollars(baseCents + extra)}
            </span>
          </div>
        </div>
        <ul className="flex flex-col gap-3">
          {addons.map((addon) => {
            const enabled = Boolean(on[addon.key])
            return (
              <li key={addon.key}>
                <label
                  className={`flex cursor-pointer items-center gap-5 rounded-[20px] border-[1.5px] p-6 transition-colors ${enabled ? 'border-mkt-navy bg-mkt-cream' : 'border-mkt-addon-border bg-mkt-white'}`}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="flex flex-wrap items-center gap-2.5">
                      <span className={cardTitleClass}>{addon.title}</span>
                      <span className="rounded-full bg-mkt-navy px-2.5 py-1 font-mono text-[15px] font-semibold text-mkt-white">
                        {addon.price}
                      </span>
                    </span>
                    <span className="text-[16px] leading-normal font-medium text-mkt-body">{addon.blurb}</span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={addon.title}
                    className="mkt-switch relative h-11 w-[60px] shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                    onClick={() => setOn((current) => ({ ...current, [addon.key]: !current[addon.key] }))}
                  >
                    <span aria-hidden="true" className={`mkt-switch-track absolute inset-x-0 top-[5px] h-[34px] rounded-full ${enabled ? 'bg-mkt-navy' : 'bg-mkt-switch'}`} />
                    <span aria-hidden="true" className={`mkt-switch-knob absolute top-[9px] h-[26px] w-[26px] rounded-full bg-mkt-white shadow-[var(--mkt-knob-shadow)] ${enabled ? 'left-[30px]' : 'left-1'}`} />
                  </button>
                </label>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
