'use client'

import { SurveyPlat } from './survey-plat'
import { Parallax, useCountUp } from './scroll-fx'

const STATS = [
  {
    prefix: '',
    target: 1,
    suffix: ' state',
    label: "California for now. Your county's records, already loaded.",
  },
  {
    prefix: '',
    target: 4,
    suffix: ' minutes',
    label: 'To set up. Once. Then it runs on its own.',
  },
  {
    prefix: '$',
    target: 19,
    suffix: '/mo',
    label: 'Flat. Add more only if you ever want it.',
  },
]

function Stat({
  prefix,
  target,
  suffix,
  label,
}: {
  prefix: string
  target: number
  suffix: string
  label: string
}) {
  const { ref, value } = useCountUp(target)
  return (
    <div className="py-3">
      <dt
        ref={ref as React.Ref<HTMLElement>}
        className="text-[30px] font-[680] leading-none tracking-[-0.03em] text-background tabular-nums sm:text-[36px]"
      >
        {prefix}
        {value}
        {suffix}
      </dt>
      <dd className="mt-2 max-w-[15rem] text-[14px] leading-relaxed text-background/70">
        {label}
      </dd>
    </div>
  )
}

export function ProofBand() {
  return (
    <section className="relative overflow-hidden bg-blue text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <Parallax speed={0.3} className="absolute inset-x-0 -top-20 h-[160%]">
          <SurveyPlat
            className="h-full w-full text-background"
            style={{ opacity: 0.07 }}
          />
        </Parallax>
      </div>

      <div className="relative mx-auto max-w-5xl px-5 py-12 sm:py-14">
        <dl className="grid gap-8 border-y border-background/10 py-2 sm:grid-cols-3 sm:gap-6">
          {STATS.map((s) => (
            <Stat key={s.suffix} {...s} />
          ))}
        </dl>
      </div>
    </section>
  )
}
