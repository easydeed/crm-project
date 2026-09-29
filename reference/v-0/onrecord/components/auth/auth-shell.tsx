'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Wordmark } from '@/components/wordmark'
import { SurveyPlat } from '@/components/marketing/survey-plat'

const PROOF_LINES = [
  {
    stat: 'LOT 14 · TRACT 2571',
    line: 'Every note is pinned to the exact parcel on the county map.',
  },
  {
    stat: 'GRANT DEED · 2019-0447120',
    line: 'Drawn from the public record — the deed, not a mailing list.',
  },
  {
    stat: 'ASSESSED $184,200',
    line: 'Prop 13 keeps their tax basis low. We show them the gap.',
  },
  {
    stat: '3 SALES THIS QUARTER',
    line: 'When a neighbor sells, the whole street hears about it.',
  },
]

/**
 * Split-screen auth layout: a dark "public record" showcase panel on the
 * left (survey plat + a tactile parcel artifact + rotating proof lines) and
 * the form content on the right. The showcase collapses on small screens.
 */
export function AuthShell({
  children,
  artifact,
  footer,
}: {
  children: ReactNode
  artifact: ReactNode
  footer?: ReactNode
}) {
  const [proof, setProof] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const id = setInterval(
      () => setProof((p) => (p + 1) % PROOF_LINES.length),
      3800,
    )
    return () => clearInterval(id)
  }, [])

  const current = PROOF_LINES[proof]

  return (
    <div className="flex min-h-svh flex-col bg-surface lg:flex-row">
      {/* Showcase panel */}
      <aside className="relative hidden overflow-hidden bg-ink lg:flex lg:w-[46%] lg:flex-col lg:justify-between">
        <SurveyPlat
          className="pointer-events-none absolute inset-0 h-full w-full text-white/[0.07]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 20% 0%, transparent 40%, rgba(0,0,0,0.35) 100%)',
          }}
          aria-hidden
        />

        <div className="relative z-10 p-10">
          <Link
            href="/"
            aria-label="onrecord — home"
            className="inline-flex items-center gap-2 rounded-md text-[17px] font-[680] tracking-[-0.03em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <span
              aria-hidden="true"
              className="grid size-6 place-items-center rounded-[7px] bg-blue text-[13px] font-[680] text-white"
            >
              o
            </span>
            <span aria-hidden="true">onrecord</span>
          </Link>
        </div>

        <div className="relative z-10 flex flex-col items-center px-10">
          {artifact}
        </div>

        <div className="relative z-10 p-10">
          <div className="h-px w-full bg-white/10" />
          <div className="mt-6 min-h-[80px]" aria-live="polite">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
              {current.stat}
            </p>
            <p
              key={proof}
              className="mt-2 max-w-sm text-pretty font-serif text-[19px] leading-snug text-white/90 fade-rise"
            >
              {current.line}
            </p>
          </div>
          <div className="mt-5 flex gap-1.5" aria-hidden>
            {PROOF_LINES.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === proof ? 'w-7 bg-white/70' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Form side */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between px-5 py-5 lg:hidden">
          <Wordmark />
        </header>
        <main className="flex flex-1 items-center justify-center px-5 pb-16 pt-2 lg:px-10 lg:pt-10">
          <div className="w-full max-w-sm">
            {children}
            {footer}
          </div>
        </main>
      </div>
    </div>
  )
}
