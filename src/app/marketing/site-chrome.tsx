import Link from 'next/link'
import { barCtaClass, barLinkClass, displayClass, planPrice } from '@/app/marketing/ui'

const wordmarkClass = `${displayClass} text-[22px] font-extrabold tracking-[-0.02em]`

/** The marketing header, on the bar. On /sample the wordmark goes home; on / it is just the name. */
export function SiteHeader({ onHome }: { onHome: boolean }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 pt-6 sm:px-8">
      {onHome ? (
        <p className={wordmarkClass}>onrecord</p>
      ) : (
        <Link className={`tap rounded-md ${wordmarkClass} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`} href="/">
          onrecord
        </Link>
      )}
      <nav aria-label="Site" className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {onHome ? (
          <Link className={barLinkClass} href="/sample">
            Sample note
          </Link>
        ) : null}
        <Link className={barLinkClass} href="/login">
          Sign in
        </Link>
        <Link className={barCtaClass} href="/register">
          Start for {planPrice} a month
        </Link>
      </nav>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="bg-bar text-on-bar">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 sm:px-8">
        <p className={wordmarkClass}>onrecord</p>
        <p className="text-[15px]">California only. Digital only. One thing, done well.</p>
      </div>
    </footer>
  )
}
