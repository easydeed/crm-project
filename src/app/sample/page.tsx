import Link from 'next/link'
import { DigestPreviewPanel } from '@/app/digest/preview-panel'
import { fullDigest } from '@/digest/canonical-facts'

export default function SamplePage() {
  const result = fullDigest()
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <p className="text-[15px] font-semibold tracking-tight">onrecord</p>
      <DigestPreviewPanel title="A sample note for Marilyn" result={result} />
      <Link
        className="text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        href="/"
      >
        Back
      </Link>
    </main>
  )
}
