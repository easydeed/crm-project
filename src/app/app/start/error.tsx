'use client'

import Link from 'next/link'
import { linkClass } from '@/app/app/people/ui'

export default function StartError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">We couldn&apos;t load this page.</h1>
      <p className="mt-3 max-w-xl text-[15px]">
        Try again. You can also add people from the People page.
      </p>
      <p className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[15px]">
        <button
          className={`tap ${linkClass}`}
          type="button"
          onClick={reset}
        >
          Try again
        </button>
        <Link
          className={`tap ${linkClass}`}
          href="/app/people/import"
        >
          Add people
        </Link>
      </p>
    </main>
  )
}
