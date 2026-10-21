import Link from 'next/link'
import { displayClass, navLinkClass, pillClass, planPrice } from '@/app/marketing/ui'

const wordmarkClass = `${displayClass} text-[22px] leading-[normal] font-extrabold tracking-[-0.02em]`

const LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#sample', label: 'Sample email' },
  { href: '#price', label: 'Price' },
]

/** The marketing header. On / the four section links sit with Sign in. On /sample the wordmark goes home. */
export function SiteHeader({ onHome }: { onHome: boolean }) {
  return (
    <header className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-4 px-[clamp(20px,4vw,48px)] pt-7">
      {onHome ? (
        <p className={wordmarkClass}>onrecord</p>
      ) : (
        <Link className={`tap rounded-md ${wordmarkClass} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`} href="/">
          onrecord
        </Link>
      )}
      <nav aria-label="Site" className="flex flex-wrap items-center gap-1">
        {onHome
          ? LINKS.map((link) => (
              <Link key={link.href} className={navLinkClass} href={link.href}>
                {link.label}
              </Link>
            ))
          : null}
        <Link className={navLinkClass} href="/login">
          Sign in
        </Link>
        <Link className={`${pillClass} ml-2`} href="/register">
          Start for {planPrice}
        </Link>
      </nav>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="bg-mkt-navy text-mkt-white">
      <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-4 px-[clamp(20px,4vw,48px)] py-10">
        <p className={`${displayClass} text-[18px] font-extrabold tracking-[-0.02em]`}>onrecord</p>
        <p className="text-[15px] font-medium text-mkt-muted">California only. Digital only. One thing, done well.</p>
      </div>
    </footer>
  )
}
