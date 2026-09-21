import Link from 'next/link'

export default function PersonNotFound() {
  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">We couldn&apos;t find that person.</h1>
      <p className="mt-3 max-w-xl text-[15px]">They may have been removed from your list.</p>
      <p className="mt-6">
        <Link
          className="text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/app/people"
        >
          Back to your people
        </Link>
      </p>
    </main>
  )
}
