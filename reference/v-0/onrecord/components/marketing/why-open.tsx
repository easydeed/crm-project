'use client'

import { SectionHeading } from './section-heading'
import { Reveal, useCountUp } from './scroll-fx'

const SUPPORTING = [
  {
    figure: '3 of 41',
    title: 'What the neighbors really sold for',
    body: 'Houses within a few doors, and the price on the actual paperwork. Not a guess, not a listing price. The real number.',
  },
  {
    figure: '7 yrs',
    title: "How long they've been in the house",
    body: 'And whether they still have the same loan they started with.',
  },
]

/** Assessed vs. market gap — the number a homeowner never gets anywhere else. */
function Prop13Card() {
  const savings = useCountUp(2600)
  // assessed value ($817,800) as a share of what a new buyer is taxed on ($1,040,000)
  const assessedPct = Math.round((817800 / 1040000) * 100)

  return (
    <Reveal className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_36px_90px_-48px_rgba(14,23,41,0.4)]">
      <div className="grid gap-0 sm:grid-cols-[1.05fr_1fr]">
        {/* Left: the claim */}
        <div className="border-b border-line p-7 sm:border-b-0 sm:border-r sm:p-9">
          <p className="text-[11px] font-[620] uppercase tracking-[0.14em] text-blue">
            Proposition 13
          </p>
          <h3 className="mt-3 text-balance font-serif text-[26px] font-[560] leading-[1.08] tracking-[-0.01em] text-ink sm:text-[30px]">
            How much they&apos;re saving on property taxes
          </h3>
          <div className="mt-6 flex items-end gap-2">
            <span
              ref={savings.ref as React.RefObject<HTMLSpanElement>}
              className="text-[58px] font-[680] leading-none tracking-[-0.04em] text-blue tabular-nums sm:text-[68px]"
            >
              ${savings.value.toLocaleString()}
            </span>
            <span className="mb-2 text-[15px] font-[560] text-muted-foreground">
              / year
            </span>
          </div>
          <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
            They pay tax on $817,800. Somebody buying that house today would pay
            tax on $1,040,000. That&apos;s about $2,600 a year they keep{' '}
            {'\u2014'} and they lose it if they sell. Unless they move it to
            their next house, which California lets some people do. Their
            accountant never tells them this. You do.
          </p>
        </div>

        {/* Right: the gap made visual */}
        <div className="relative flex flex-col justify-end gap-4 bg-surface/50 p-7 sm:p-9">
          <div className="flex items-end justify-center gap-8">
            <div className="flex w-24 flex-col items-center gap-2">
              <div className="flex h-40 items-end">
                <Reveal delay={160} className="flex h-full w-14 items-end">
                  <div
                    className="grow-up w-full rounded-t-md bg-blue"
                    style={{ height: `${(assessedPct / 100) * 160}px` }}
                  />
                </Reveal>
              </div>
              <span className="text-center text-[12px] font-[560] leading-tight text-muted-foreground">
                They&apos;re taxed on
              </span>
              <span className="text-[13px] font-[620] text-blue tabular-nums">
                $817,800
              </span>
            </div>
            <div className="flex w-24 flex-col items-center gap-2">
              <div className="flex h-40 items-end">
                <Reveal className="flex h-full w-14 items-end">
                  <div
                    className="grow-up w-full rounded-t-md bg-line"
                    style={{ height: '160px' }}
                  />
                </Reveal>
              </div>
              <span className="text-center text-[12px] font-[560] leading-tight text-muted-foreground">
                A new buyer would be taxed on
              </span>
              <span className="text-[13px] font-[620] text-ink tabular-nums">
                $1,040,000
              </span>
            </div>
          </div>
          <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
            Bought in 2019 for $712,000. The blue is what they actually pay tax
            on.
          </p>
        </div>
      </div>
    </Reveal>
  )
}

export function WhyOpen() {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-5xl px-5">
        <Reveal>
          <SectionHeading
            eyebrow="Why they open it"
            title="Three things they can only get here"
          />
        </Reveal>

        <div className="mt-10">
          <Prop13Card />
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {SUPPORTING.map((r, i) => (
            <Reveal
              key={r.title}
              delay={i * 120}
              className="rounded-2xl border border-line bg-white p-6"
            >
              <p className="text-[34px] font-[680] leading-none tracking-[-0.03em] text-blue tabular-nums">
                {r.figure}
              </p>
              <h3 className="mt-4 text-[16px] font-[620] text-ink">{r.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                {r.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
