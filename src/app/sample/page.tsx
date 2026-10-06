import Link from 'next/link'
import { linkClass } from '@/app/app/people/ui'
import { DigestPreviewPanel } from '@/app/digest/preview-panel'
import { fullDigest } from '@/digest/canonical-facts'

export default function SamplePage() {
  const result = fullDigest()
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <p className="text-[15px] font-semibold tracking-tight">onrecord</p>
      <DigestPreviewPanel title="A sample note for Marilyn" result={result} />
      <Link
        className={linkClass}
        href="/"
      >
        Back
      </Link>
    </main>
  )
}
