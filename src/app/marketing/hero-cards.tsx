'use client'

import { useState } from 'react'
import { callBarClass } from '@/app/marketing/ui'
import type { SampleCall } from '@/app/marketing/sample-calls'

const POS = [
  { left: '0%', top: '0px', rot: '-6deg' },
  { left: '11%', top: '90px', rot: '2deg' },
  { left: '22%', top: '190px', rot: '-2deg' },
]

/**
 * The three sample calls as the v6 fan. Card 3 starts in front. Hover, click and keyboard focus
 * bring a card forward; below 1024px the same cards are a vertical list. The "Call" bar is drawn,
 * as v6 drew it: a picture of the call list's button, not a control (OR-054). Each card takes
 * focus itself, so a keyboard can still bring a covered card to the front.
 */
export function HeroCards({ calls }: { calls: SampleCall[] }) {
  const [front, setFront] = useState(calls.length - 1)
  return (
    <div className="relative flex w-full max-w-[520px] flex-col gap-4 justify-self-center lg:block lg:h-[620px]">
      {calls.map((call, index) => {
        const place = POS[index] ?? POS[0]!
        const raised = index === front
        const top = raised ? `${parseInt(place.top, 10) - 16}px` : place.top
        return (
          <article
            key={call.kind}
            tabIndex={0}
            aria-label={`Sample call ${index + 1}: ${call.name}, ${call.tag}`}
            className="hero-card flex flex-col overflow-hidden rounded-[24px] bg-mkt-gold p-[22px] text-mkt-navy shadow-[var(--mkt-card-shadow)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-mkt-white"
            style={{
              ['--left' as string]: place.left,
              ['--top' as string]: top,
              ['--rot' as string]: raised ? '0deg' : place.rot,
              ['--z' as string]: String(raised ? 10 : index + 1),
            }}
            onMouseEnter={() => setFront(index)}
            onClick={() => setFront(index)}
            onFocus={() => setFront(index)}
          >
            <div className="mb-4 hidden h-[124px] shrink-0 flex-col justify-end gap-0.5 overflow-hidden rounded-[14px] bg-mkt-navy p-4 lg:flex">
              <p className="font-mono text-[15px] font-medium text-mkt-gold">{call.address}</p>
              <p className="font-mono text-[15px] font-medium text-mkt-muted">{call.city}</p>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[48px] leading-[0.9] font-black tracking-[-0.025em]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="rounded-full border-[1.5px] border-mkt-navy px-[11px] py-[7px] text-[15px] font-extrabold tracking-[0.06em] uppercase">
                {call.tag}
              </span>
            </div>
            <div className="mt-auto flex flex-col gap-2.5">
              <p className="text-[36px] leading-[0.98] font-extrabold tracking-[-0.03em]">{call.name}</p>
              <p className="text-[16px] leading-snug font-medium">{call.detail}</p>
            </div>
            <span aria-hidden="true" className={`${callBarClass} mt-4`}>
              Call {call.name.split(' ')[0]}
            </span>
          </article>
        )
      })}
    </div>
  )
}
