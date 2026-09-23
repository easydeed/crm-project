import Link from 'next/link'
import { linkClass } from '@/app/app/people/ui'

export function HomeownersSection() {
  return (
    <section aria-labelledby="homeowners-heading" className="px-4 py-8">
      <h2 className="text-[19px] font-semibold" id="homeowners-heading">
        Your homeowners
      </h2>
      <p className="mt-3 max-w-xl text-[15px]">
        Everyone you&apos;ve closed with, the house they&apos;re matched to, and whether they get
        the monthly note.
      </p>
      <Link className={`mt-3 inline-block ${linkClass}`} href="/app/people">
        Open people
      </Link>
    </section>
  )
}
