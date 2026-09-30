import { SectionHeading } from './section-heading'
import { Tag } from '@/components/tag'
import { Reveal } from './scroll-fx'
import { SIGNAL_META } from '@/components/app/signal-meta'
import type { CallSignalKind } from '@/lib/types'

const CALLS: { name: string; kind: CallSignalKind; tag: string; detail: string }[] = [
  {
    name: 'Marilyn Okafor',
    kind: 'reading_closely',
    tag: 'Reading it closely',
    detail:
      'She opened your last three emails. Twice she clicked the part about her property taxes.',
  },
  {
    name: 'Ray & Teresa Villanueva',
    kind: 'new_deed_nearby',
    tag: 'Big sale next door',
    detail:
      'A house two doors down just sold for $1,120,000. Highest price their street has seen.',
  },
  {
    name: 'Glenn Sato',
    kind: 'loan_reconveyed',
    tag: 'Paid off his loan',
    detail:
      'His mortgage was just paid off or refinanced. Something changed with his money this month.',
  },
]

export function CallList() {
  return (
    <section className="bg-surface py-16">
      <div className="mx-auto max-w-3xl px-5">
        <Reveal>
          <SectionHeading
            eyebrow="The part that makes your phone ring"
            title="And it tells you who to call"
          />
          <p className="mt-4 text-pretty text-center text-[15px] leading-relaxed text-muted-foreground">
            The email keeps you in touch. On the 1st, this shows up on top{' '}
            {'\u2014'} three people worth a call, and exactly why.
          </p>
        </Reveal>

        <Reveal
          delay={100}
          className="mt-8 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_28px_70px_-30px_rgba(14,23,41,0.28)]"
        >
          {/* live console header */}
          <div className="flex items-center justify-between border-b border-line bg-ink px-5 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-2.5">
                <span className="pulse-dot absolute inline-flex size-full rounded-full bg-[var(--green)] opacity-70" />
                <span className="relative inline-flex size-2.5 rounded-full bg-[var(--green)]" />
              </span>
              <span className="text-[12px] font-[560] uppercase tracking-[0.1em]">
                Worth a call this month
              </span>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[12px] font-[620] tabular-nums">
              3
            </span>
          </div>

          <ul>
            {CALLS.map((s, i) => {
              const meta = SIGNAL_META[s.kind]
              return (
                <Reveal
                  as="li"
                  key={s.name}
                  delay={200 + i * 110}
                  className="flex items-center gap-4 border-b border-line px-5 py-4 transition-colors last:border-b-0 hover:bg-surface/60"
                >
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: meta.bg, color: meta.fg }}
                    aria-hidden
                  >
                    <meta.icon className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-[620] text-ink">{s.name}</p>
                      <Tag tone={meta.tone}>{s.tag}</Tag>
                    </div>
                    <p className="mt-0.5 text-pretty text-[14px] leading-relaxed text-muted-foreground">
                      {s.detail}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className="hidden size-9 shrink-0 items-center justify-center rounded-full border border-line text-muted-foreground sm:flex"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                </Reveal>
              )
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
