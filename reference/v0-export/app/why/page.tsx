import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Wordmark } from '@/components/wordmark'

export const metadata = {
  title: 'Why you got this — onrecord',
  description: 'An explainer for homeowners who received a note built on onrecord.',
}

export default function WhyPage() {
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
          For homeowners
        </p>
        <h1 className="mt-2 text-balance font-serif text-[34px] font-[560] leading-tight tracking-[-0.01em] text-ink">
          Why you got this note
        </h1>

        <div className="mt-8 flex flex-col gap-5 text-[16px] leading-relaxed text-ink">
          <p>
            You received a monthly note because a real estate agent you know {'\u2014'}
            the person whose name is on the email {'\u2014'} added you to their
            list. It&apos;s written for you, not blasted to a crowd.
          </p>
          <p>
            The facts in it {'\u2014'} what your home is worth, what sold nearby,
            what your property taxes look like {'\u2014'} come from public county
            records. Deeds and tax rolls are open to anyone; onrecord just reads
            them and puts them in plain language so your agent can share them.
          </p>
          <p>
            If you&apos;d rather not get it, every email has an unsubscribe link at
            the bottom and it works immediately. No hard feelings, and your agent
            is told nothing changes about your relationship with them.
          </p>
          <p className="text-[14px] text-muted-foreground">
            Curious what your agent sees?{' '}
            <Link href="/sample" className="font-[560] text-blue hover:underline">
              Read a full sample note.
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
