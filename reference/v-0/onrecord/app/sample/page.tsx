import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/wordmark'
import { SampleEmail } from '@/components/digest/sample-email'

export default function SamplePage() {
  return (
    <div className="min-h-screen bg-surface pb-28">
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

      <main className="mx-auto max-w-2xl px-5 py-10">
        <div className="mb-8 text-center">
          <p className="text-[12px] font-[620] uppercase tracking-[0.12em] text-blue">
            A sample email
          </p>
          <h1 className="mt-2 text-balance text-[26px] font-[680] leading-tight tracking-[-0.02em] text-ink">
            This is the whole thing. Read it before you sign up.
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            One homeowner, one month, built entirely from their county record.
          </p>
        </div>

        <SampleEmail variant="page" />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-5 py-3">
          <p className="text-[13px] text-muted-foreground">
            Cancel any month. Up to 250 homeowners.
          </p>
          <Button
            nativeButton={false}
            render={<Link href="/register" />}
            className="h-10 bg-blue px-5 text-[15px] font-[620] text-white [a]:hover:bg-blue/90"
          >
            Start for $19 a month
          </Button>
        </div>
      </div>
    </div>
  )
}
