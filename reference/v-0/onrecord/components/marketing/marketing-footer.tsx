import Link from 'next/link'
import { Wordmark } from '@/components/wordmark'
import { SurveyPlat } from './survey-plat'

const columns: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Sample email', href: '/sample' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'Start for $19', href: '/register' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'Create an account', href: '/register' },
      { label: 'The console', href: '/app' },
    ],
  },
  {
    heading: 'For homeowners',
    links: [
      { label: 'Why you got this', href: '/why' },
      { label: 'Update your address', href: '/unsubscribe' },
      { label: 'Unsubscribe', href: '/unsubscribe' },
    ],
  },
]

export function MarketingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <SurveyPlat
          className="absolute -right-24 -top-16 h-[150%] w-[70%] text-white"
          style={{ opacity: 0.06 }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Wordmark className="text-white [&_span:last-child]:text-white" />
            <p className="mt-4 text-pretty text-[15px] leading-relaxed text-white/70">
              The monthly note your past clients actually open — built from their
              own property record, not another newsletter.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex h-10 items-center rounded-lg bg-white px-4 text-[14px] font-[620] text-ink transition-colors hover:bg-white/90"
            >
              Start for $19 a month
            </Link>
          </div>

          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="text-[12px] font-[640] uppercase tracking-[0.14em] text-white/45">
                {col.heading}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-white/75 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 rounded-xl border border-white/12 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-5 items-center justify-center rounded-[5px] border border-white/25 text-[10px] font-[680] text-white/60">
              §
            </span>
            <span className="text-[12px] font-[640] uppercase tracking-[0.14em] text-white/45">
              About the data
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-white/55">
            Figures are drawn from Los Angeles County recorded documents and
            public assessment data. Estimated values are always labeled as
            estimates. onrecord does not provide tax or legal advice — homeowners
            should confirm Prop 13 and Prop 19 questions with a qualified
            professional.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 text-[13px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} onrecord. Made for agents who stay in touch.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/privacy" className="transition-colors hover:text-white">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-white">
            Terms
          </Link>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-1.5 rounded-full bg-green" />
              Built on public record
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
