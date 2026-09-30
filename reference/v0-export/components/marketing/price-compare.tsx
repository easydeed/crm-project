'use client'

import { useEffect, useRef, useState } from 'react'
import { SectionHeading } from './section-heading'
import { Reveal } from './scroll-fx'

const TOOLS = [
  { name: 'onrecord', price: 19, ours: true },
  { name: 'Wise Agent', price: 49, ours: false },
  { name: 'Homebot solo', price: 50, ours: false },
  { name: 'Follow Up Boss', price: 69, ours: false },
  { name: 'Fello', price: 165, ours: false },
]

const MAX = 165

export function PriceCompare() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [run, setRun] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRun(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRun(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id="pricing" className="bg-white py-16 scroll-mt-20">
      <div className="mx-auto max-w-5xl px-5">
        <Reveal>
          <SectionHeading
            eyebrow="What the alternatives cost"
            title="One thing, at one price"
          />
        </Reveal>

        <div ref={ref} className="mx-auto mt-10 max-w-2xl space-y-2.5">
          {TOOLS.map((t, i) => (
            <div
              key={t.name}
              className={[
                'flex items-center gap-4 rounded-xl px-3 py-2',
                t.ours ? 'bg-blue/[0.06]' : '',
              ].join(' ')}
            >
              <div
                className={[
                  'w-32 shrink-0 text-right text-[14px]',
                  t.ours ? 'font-[680] text-blue' : 'font-[560] text-ink',
                ].join(' ')}
              >
                {t.name}
              </div>
              <div className="flex-1">
                <div className="relative h-10 overflow-hidden rounded-lg bg-surface">
                  <div
                    className={[
                      'flex h-full items-center justify-end rounded-lg pr-3',
                      t.ours ? 'bg-blue' : 'bg-line',
                    ].join(' ')}
                    style={{
                      width: run ? `${(t.price / MAX) * 100}%` : '0%',
                      transition: `width 1.1s cubic-bezier(0.2,0.7,0.2,1) ${i * 90}ms`,
                    }}
                  >
                    <span
                      className={[
                        'text-[14px] font-[680] tabular-nums',
                        t.ours ? 'text-white' : 'text-ink',
                      ].join(' ')}
                    >
                      ${t.price}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Reveal delay={200}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-[15px] leading-relaxed text-ink">
            <span className="font-[680] text-blue">Up to $146 a month less</span>{' '}
            than the tools agents already pay for.
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-center text-[13px] leading-relaxed text-muted-foreground">
            That&apos;s the $19 base plan, before any add-ons. Published monthly
            prices as of August 2026, per user where applicable. Those tools all
            do more than this one. That&apos;s the point.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
