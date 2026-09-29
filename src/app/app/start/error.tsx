'use client'

import Link from 'next/link'

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
          className="tap underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          type="button"
          onClick={reset}
        >
          Try again
        </button>
        <Link
          className="tap underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/app/people/import"
        >
          Add people
        </Link>
      </p>
    </main>
  )
}
