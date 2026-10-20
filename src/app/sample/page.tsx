import Link from 'next/link'
import { DigestPreviewPanel } from '@/app/digest/preview-panel'
import { SiteFooter, SiteHeader } from '@/app/marketing/site-chrome'
import { ctaClass, displayClass, planPrice } from '@/app/marketing/ui'
import { fullDigest } from '@/digest/canonical-facts'

export default function SamplePage() {
  const result = fullDigest()
  return (
    <>
      <div className="bg-bar pb-6 text-on-bar">
        <SiteHeader onHome={false} />
      </div>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
        <h1 className={`${displayClass} text-[32px] font-black leading-tight tracking-[-0.02em] sm:text-[40px]`}>
          The note, as a homeowner gets it.
        </h1>
        <DigestPreviewPanel title="A sample note for Marilyn" result={result} />
        <Link className={ctaClass} href="/register">
          Start for {planPrice} a month
        </Link>
      </main>
      <SiteFooter />
    </>
  )
}
