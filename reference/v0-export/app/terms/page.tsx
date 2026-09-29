import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Wordmark } from '@/components/wordmark'

export const metadata = {
  title: 'Terms — onrecord',
  description: 'The plain-language terms of using onrecord.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Wordmark />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-14">
        <p className="text-[12px] font-[620] uppercase tracking-[0.12em] text-blue">
          Terms
        </p>
        <h1 className="mt-2 text-balance font-serif text-[34px] font-[560] leading-tight tracking-[-0.01em] text-ink">
          The deal, in plain words
        </h1>

        <div className="mt-8 flex flex-col gap-5 text-[16px] leading-relaxed text-ink">
          <p>
            onrecord is $19 a month for the base plan {'\u2014'} the monthly note,
            your list, and your call list. Add-ons are billed on top only when you
            turn them on, at the prices shown on the home page. There&apos;s no
            contract and no per-seat pricing.
          </p>
          <p>
            You can cancel any month. When you cancel, billing stops at the end of
            the current period and your list stays exportable. Turn any single
            add-on off and that charge stops the next month.
          </p>
          <p>
            You&apos;re responsible for having permission to contact the people you
            add, and for following email and texting rules. We give you the tools
            to comply {'\u2014'} working unsubscribe links, STOP handling, carrier
            registration {'\u2014'} but the relationship with your contacts is
            yours.
          </p>
          <p className="text-[14px] text-muted-foreground">
            This is a short plain-language summary, not the final legal document.
            Questions? Email hello@onrecord.example.
          </p>
        </div>
      </main>
    </div>
  )
}
