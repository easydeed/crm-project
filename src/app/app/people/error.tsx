'use client'

export default function PeopleError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">We couldn&apos;t load your people.</h1>
      <p className="mt-3 max-w-xl text-[15px]">
        Try again. If it keeps happening, sign out and sign in.
      </p>
      <button
        className="mt-6 text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        type="button"
        onClick={reset}
      >
        Try again
      </button>
    </main>
  )
}
