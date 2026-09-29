import Link from 'next/link'
import { PhoneCall } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ParcelMap } from '@/components/parcel-map'
import { SurveyPlat } from './survey-plat'
import { Parallax } from './scroll-fx'
import type { Lot } from '@/lib/types'

const HERO_LOTS: Lot[] = [
  { id: 'h1', col: 0, row: 0, kind: 'plain' },
  { id: 'h2', col: 1, row: 0, kind: 'sold', price: 968000 },
  { id: 'h3', col: 2, row: 0, kind: 'client' },
  { id: 'h4', col: 3, row: 0, kind: 'plain' },
  { id: 'h5', col: 4, row: 0, kind: 'plain' },
  { id: 'h6', col: 0, row: 1, kind: 'plain' },
  { id: 'h7', col: 1, row: 1, kind: 'sold', price: 1120000 },
  { id: 'h8', col: 2, row: 1, kind: 'plain' },
  { id: 'h9', col: 3, row: 1, kind: 'sold', price: 902500 },
  { id: 'h10', col: 4, row: 1, kind: 'plain' },
]

const RECORD_PILLS = ['Recorded $712,000', 'Owned 7 yrs', 'Prop 13 saves $2,600/yr']

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <Parallax speed={0.4} className="absolute inset-x-0 -top-24 h-[150%]">
          <SurveyPlat
            animated
            className="plat-fade h-full w-full text-blue"
            style={{ opacity: 0.14 }}
          />
        </Parallax>
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pt-20 pb-28 sm:pt-28 sm:pb-36 lg:pt-32 lg:pb-44">
        <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:gap-20">
          {/* Left: the pitch */}
          <div className="max-w-xl">
            <span
              className="reveal inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[12.5px] font-[560] text-ink shadow-sm"
              style={{ animationDelay: '40ms' }}
            >
              <span className="size-1.5 rounded-full bg-coral" aria-hidden />
              For agents who&apos;d rather keep in touch than cold-call
            </span>

            <h1
              className="reveal mt-6 text-balance text-[38px] font-[680] leading-[1.04] tracking-[-0.03em] text-ink sm:text-[50px] lg:text-[56px]"
              style={{ animationDelay: '120ms' }}
            >
              Three past clients are worth a call this month.{' '}
              <span className="text-blue">We tell you which three.</span>
            </h1>

            <p
              className="reveal mt-6 max-w-lg text-pretty text-[16px] leading-relaxed text-muted-foreground sm:text-[18px]"
              style={{ animationDelay: '200ms' }}
            >
              Every month we send your past clients a note about their own
              house {'\u2014'} what the neighbors really sold for, straight from
              county records. Then we tell you which three of them to call.
            </p>

            <div
              className="reveal mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: '280ms' }}
            >
              <Button
                nativeButton={false}
                render={<Link href="/register" />}
                className="h-12 bg-blue px-6 text-[16px] font-[620] text-white shadow-[0_10px_24px_-8px_var(--blue)] [a]:hover:bg-blue/90"
              >
                Start for $19 a month
              </Button>
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link href="/sample" />}
                className="h-12 px-4 text-[15px] font-[560] text-ink [a]:hover:bg-surface"
              >
                See a sample email {'\u2192'}
              </Button>
            </div>

            <p
              className="reveal mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-relaxed text-muted-foreground"
              style={{ animationDelay: '340ms' }}
            >
              <span>Up to 250 homeowners</span>
              <span className="text-line" aria-hidden>
                {'\u2022'}
              </span>
              <span>Cancel any month</span>
              <span className="text-line" aria-hidden>
                {'\u2022'}
              </span>
              <span>Set up in minutes</span>
            </p>
          </div>

          {/* Right: the artifact */}
          <div
            className="reveal relative"
            style={{ animationDelay: '420ms' }}
          >
            <div
              aria-hidden
              className="absolute inset-0 -z-10 translate-x-4 translate-y-6 rotate-2 rounded-3xl border border-line bg-white/60"
            />

            <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_28px_70px_-24px_rgba(14,23,41,0.32)]">
              <div className="flex items-center gap-3 border-b border-line px-5 py-4">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-soft text-[13px] font-[680] text-blue"
                  aria-hidden
                >
                  DW
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-[600] text-ink">
                    Dana Whitfield {'\u00b7'} Coastline Realty
                  </p>
                  <p className="truncate text-[12.5px] text-muted-foreground">
                    to you {'\u2014'} your monthly home record
                  </p>
                </div>
                <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-[560] uppercase tracking-[0.08em] text-muted-foreground">
                  Monthly
                </span>
              </div>

              <div className="px-5 pt-4">
                <p className="text-[15px] font-[620] text-ink">
                  1142 Oakdale Ave {'\u2014'} what your street did this year
                </p>
                <div className="mb-2 flex items-center justify-between pt-3">
                  <p className="text-[12.5px] font-[560] text-ink">Oakdale Ave</p>
                  <p className="text-[11.5px] text-muted-foreground">
                    La Verne {'\u00b7'} 3 recorded sales
                  </p>
                </div>
              </div>

              <div className="px-5">
                <ParcelMap
                  lots={HERO_LOTS}
                  streetName="Oakdale Ave"
                  animated
                  ariaLabel="Street plan of Oakdale Ave in La Verne. The homeowner's lot is highlighted in blue and three recently sold lots are outlined in coral with their recorded prices."
                />
              </div>

              <div className="flex flex-wrap gap-2 px-5 pb-5 pt-4">
                {RECORD_PILLS.map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] font-[540] text-ink"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            {/* Floating call signal that ties the email to the payoff */}
            <div
              className="reveal absolute -bottom-9 -left-6 hidden lg:block"
              style={{ animationDelay: '640ms' }}
            >
              <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-[0_18px_40px_-16px_rgba(14,23,41,0.32)]">
                <span
                  className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-green/12 text-green"
                  aria-hidden
                >
                  <PhoneCall className="size-[18px]" />
                  <span className="pulse-dot absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-green ring-2 ring-white" />
                </span>
                <div>
                  <p className="text-[13px] font-[620] text-ink">Worth a call</p>
                  <p className="text-[12px] text-muted-foreground">
                    Marilyn opened all 3 {'\u00b7'} no agent tied to her
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
