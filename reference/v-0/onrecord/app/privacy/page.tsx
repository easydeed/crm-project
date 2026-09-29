import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Wordmark } from '@/components/wordmark'

export const metadata = {
  title: 'Privacy — onrecord',
  description: 'How onrecord handles your data and your clients\u2019 data.',
}

export default function PrivacyPage() {
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
          Privacy
        </p>
        <h1 className="mt-2 text-balance font-serif text-[34px] font-[560] leading-tight tracking-[-0.01em] text-ink">
          What we do with data
        </h1>

        <div className="mt-8 flex flex-col gap-5 text-[16px] leading-relaxed text-ink">
          <p>
            onrecord is built entirely on public county records {'\u2014'} deeds,
            tax rolls, and recorded documents that anyone can look up. We combine
            that with the contacts you choose to add, and we use it for one thing:
            writing the monthly note you send.
          </p>
          <p>
            We don&apos;t sell your list, your contacts, or your clients&apos;
            information to anyone. We don&apos;t rent it, and we don&apos;t hand it
            to advertisers. Your contacts are yours; if you cancel, you can export
            them and we delete our copy.
          </p>
          <p>
            Emails we send on your behalf carry a working unsubscribe link, and we
            honor opt-outs immediately. If you turn on texting, message data is
            handled under the carriers&apos; rules and STOP always works.
          </p>
          <p className="text-[14px] text-muted-foreground">
            This is a short plain-language summary, not the final legal document.
            Questions? Email privacy@onrecord.example.
          </p>
        </div>
      </main>
    </div>
  )
}
