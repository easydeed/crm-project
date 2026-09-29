import { Reveal } from './scroll-fx'

const LINES = [
  {
    price: '$19',
    label: 'The monthly note',
    text: 'your list, and your call list.',
    base: true,
  },
  {
    price: '+$2\u2013$4',
    label: 'Text yourself the call list',
    text: 'a weekly market note, or farm a street.',
  },
  {
    price: '+$9 each',
    label: 'Text your clients or run campaigns',
    text: '250 texts included, 2\u00a2 after \u00b7 automated campaigns.',
  },
]

export function PricingLines() {
  return (
    <section className="bg-surface py-16">
      <div className="mx-auto max-w-xl px-5">
        <Reveal>
          <h2 className="text-balance text-[26px] font-[680] tracking-[-0.02em] text-ink sm:text-[30px]">
            Start at $19. Add what you need.
          </h2>
        </Reveal>

        {/* itemized statement */}
        <Reveal
          delay={80}
          className="mt-7 overflow-hidden rounded-xl border border-line bg-white shadow-[0_24px_60px_-40px_rgba(14,23,41,0.32)]"
        >
          <div className="flex items-center justify-between border-b border-dashed border-line px-5 py-3">
            <span className="text-[11px] font-[620] uppercase tracking-[0.14em] text-muted-foreground">
              Your monthly statement
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              onrecord
            </span>
          </div>

          <ul className="divide-y divide-line">
            {LINES.map((l) => (
              <li key={l.price} className="flex items-baseline gap-4 px-5 py-4">
                <span
                  className={[
                    'w-20 shrink-0 font-mono text-[15px] font-[680] tabular-nums',
                    l.base ? 'text-blue' : 'text-ink',
                  ].join(' ')}
                >
                  {l.price}
                </span>
                <span className="flex-1">
                  <span className="text-[15px] font-[620] text-ink">
                    {l.label}
                  </span>
                  <span className="mt-0.5 block text-[14px] leading-relaxed text-muted-foreground">
                    {l.text}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-baseline justify-between border-t-2 border-ink/80 px-5 py-3.5">
            <span className="text-[13px] font-[620] uppercase tracking-[0.1em] text-ink">
              Starts at
            </span>
            <span className="font-mono text-[20px] font-[680] text-ink tabular-nums">
              $19<span className="text-[13px] text-muted-foreground">/mo</span>
            </span>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <p className="mt-5 text-center text-[14px] leading-relaxed text-muted-foreground">
            Turn any line off the month you stop wanting it. No contract, no seats.
          </p>
        </Reveal>

        <Reveal delay={180}>
          <p className="mx-auto mt-3 max-w-md text-balance text-center text-[13px] leading-relaxed text-muted-foreground/80">
            The $9 tier costs more because phone carriers and campaign delivery
            cost us more. We&apos;d rather say that than bury it.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
