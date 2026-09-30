'use client'

import { PageHeader } from '@/components/app/page-header'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Band = {
  name: string
  price: string
  cadence: string
  tagline: string
  includes: string[]
  featured?: boolean
  note?: string
}

const BANDS: Band[] = [
  {
    name: 'The note',
    price: '$19',
    cadence: '/mo',
    tagline:
      'The thing onrecord is. One monthly email per client, built from their county record. This is the whole product for most agents.',
    includes: [
      'Monthly record-based email to everyone on your list',
      'The call list on the 1st — who\u2019s worth a call',
      'Unlimited people in your sphere',
      'Text yourself the call list',
    ],
  },
  {
    name: 'The note, plus reach',
    price: '$29',
    cadence: '/mo',
    featured: true,
    tagline:
      'For agents who want to run their own sends on top of the monthly note — a weekly market email, a farmed street, seasonal templates.',
    includes: [
      'Everything in The note',
      'Weekly market email from a separate sending address',
      'Farm one street (add more for $4 each)',
      'The full template library, including Pro templates',
      'Build your own campaigns to any audience',
    ],
  },
  {
    name: 'Add texting',
    price: '+$9',
    cadence: '/mo',
    tagline:
      'Text your clients directly, not just yourself. Priced separately because the phone carriers bill us per message — this covers registration and the first 250 texts.',
    includes: [
      'One-time carrier registration handled for you',
      '250 client texts a month included',
      'Extra texts at 2\u00a2 each',
      'Opt-out handling and STOP compliance built in',
    ],
    note: 'Sits on top of either plan above.',
  },
]

export function PlansView() {
  return (
    <div>
      <PageHeader
        title="Plans"
        subtitle="Priced by what you turn on, not by contact count. Start at the note; add reach and texting only if you want them."
      />

      <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
        <div className="flex flex-col gap-4">
          {BANDS.map((b) => (
            <div
              key={b.name}
              className={cn(
                'rounded-2xl border p-6',
                b.featured
                  ? 'border-blue bg-blue-soft/40 ring-1 ring-blue/20'
                  : 'border-line bg-white',
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[18px] font-[680] tracking-[-0.01em] text-ink">
                      {b.name}
                    </h2>
                    {b.featured && (
                      <span className="rounded-full bg-blue px-2 py-0.5 text-[11px] font-[680] uppercase tracking-[0.08em] text-white">
                        Most pick this
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground text-pretty">
                    {b.tagline}
                  </p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <div className="flex items-baseline gap-1 sm:justify-end">
                    <span className="text-[30px] font-[700] tracking-[-0.02em] text-ink">
                      {b.price}
                    </span>
                    <span className="text-[14px] font-[560] text-muted-foreground">
                      {b.cadence}
                    </span>
                  </div>
                  {b.note && (
                    <p className="mt-1 max-w-[180px] text-[12px] leading-snug text-muted-foreground">
                      {b.note}
                    </p>
                  )}
                </div>
              </div>

              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {b.includes.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check
                      className={cn(
                        'mt-0.5 size-4 shrink-0',
                        b.featured ? 'text-blue' : 'text-blue/70',
                      )}
                      aria-hidden
                    />
                    <span className="text-[13.5px] leading-relaxed text-ink">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-[13px] leading-relaxed text-muted-foreground">
          No contract, no per-contact fees. Turn anything off the month you stop
          wanting it.
        </p>
      </div>
    </div>
  )
}
