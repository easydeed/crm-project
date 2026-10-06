import Link from 'next/link'
import { linkClass } from '@/app/app/people/ui'

export default function PersonNotFound() {
  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">We couldn&apos;t find that person.</h1>
      <p className="mt-3 max-w-xl text-[15px]">They may have been removed from your list.</p>
      <p className="mt-6">
        <Link
          className={`tap ${linkClass}`}
          href="/app/people"
        >
          Back to your people
        </Link>
      </p>
    </main>
  )
}
