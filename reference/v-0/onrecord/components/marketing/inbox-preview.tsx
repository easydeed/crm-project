import { SectionHeading } from './section-heading'
import { Reveal } from './scroll-fx'
import { SampleEmailModal } from './sample-email-modal'

const DEED_ROWS = [
  { dt: 'Instrument', dd: 'Grant Deed', mono: false },
  { dt: 'Recorded', dd: 'Mar 14, 2019', mono: false },
  { dt: 'Document no.', dd: '2019-0248117', mono: true },
  { dt: 'Consideration', dd: '$712,000', mono: true, strong: true },
]

export function InboxPreview() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <Reveal>
        <SectionHeading
          eyebrow="What lands in their inbox"
          title="A record, not a newsletter"
        />
      </Reveal>

      <Reveal delay={120} className="mx-auto mt-8 max-w-xl">
        <div className="relative">
          {/* stacked paper behind, like a filed document */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 translate-x-2 translate-y-3 rotate-[1.4deg] rounded-sm border border-line bg-white"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 translate-x-1 translate-y-1.5 rotate-[0.6deg] rounded-sm border border-line bg-white"
          />

          <div className="relative overflow-hidden rounded-sm border border-ink/15 bg-white shadow-[0_30px_70px_-30px_rgba(14,23,41,0.35)]">
            {/* official ledger header */}
            <div className="flex items-center justify-between border-b-2 border-ink/80 px-6 py-3">
              <div>
                <p className="font-serif text-[15px] font-[560] leading-none text-ink">
                  Office of the County Recorder
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Los Angeles County {'\u00b7'} Official Records
                </p>
              </div>
              <span
                aria-hidden
                className="grid size-10 place-items-center rounded-full border border-blue/40 text-blue"
              >
                <span className="text-[9px] font-[680] uppercase leading-none tracking-[0.08em]">
                  Rec
                </span>
              </span>
            </div>

            <div className="relative p-6">
              {/* RECORDED stamp */}
              <span
                aria-hidden
                className="pointer-events-none absolute right-5 top-4 rotate-[-9deg] rounded-md border-2 border-coral/60 px-2.5 py-1 text-[11px] font-[700] uppercase tracking-[0.16em] text-coral/70"
              >
                Recorded
              </span>

              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Parcel
              </p>
              <p className="mt-1 font-serif text-[22px] font-[560] leading-none text-ink">
                1142 Oakdale Ave
              </p>
              <p className="mt-1 font-mono text-[12px] text-muted-foreground">
                APN 8391-024-017
              </p>

              <dl className="mt-5 divide-y divide-line border-y border-line">
                {DEED_ROWS.map((r) => (
                  <div key={r.dt} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-[13px] text-muted-foreground">{r.dt}</dt>
                    <dd
                      className={[
                        'text-[13px]',
                        r.strong ? 'font-[680] text-ink' : 'text-ink',
                        r.mono ? 'font-mono tabular-nums' : '',
                      ].join(' ')}
                    >
                      {r.dd}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-5 text-[14px] leading-relaxed text-muted-foreground">
                Then what their neighbors really sold for, how much they&apos;re
                saving on property taxes, and one button to write back to you.
                Real numbers off the county record {'\u2014'} sent with your name
                on it.
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={200} className="mx-auto mt-8 flex max-w-xl flex-wrap items-center gap-x-4 gap-y-2">
        <SampleEmailModal
          trigger={
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-[9px] bg-blue font-[620] text-white transition-colors hover:bg-blue/90"
              style={{ padding: '15px 28px' }}
            >
              View the whole email
            </button>
          }
        />
        <span className="text-[13px] text-muted-foreground">
          1142 Oakdale Ave {'\u00b7'} September 1, 2026
        </span>
      </Reveal>
    </section>
  )
}
