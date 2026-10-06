import Link from 'next/link'
import { buttonClass, linkClass } from '@/app/app/people/ui'
import type { CanonicalFacts } from '@/digest/canonical-facts'

const ctaClass = `${buttonClass} inline-block shadow-[0_18px_44px_-40px_rgba(14,23,41,0.4)]`

export function HomeStory({ facts }: { facts: CanonicalFacts }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-4 py-10">
      <p className="text-[15px] font-semibold tracking-tight">onrecord</p>
      <h1 className="font-serif text-[32px] font-medium leading-tight tracking-[-0.01em] sm:text-[40px]">
        A note about their house, from the county record.
      </h1>
      <p className="text-[17px] leading-relaxed">
        {facts.address}, {facts.city} {facts.zip}. {facts.firstName}.
      </p>
      <p className="text-[17px] leading-relaxed">
        Homes on Oakdale have recently sold for {facts.streetMedian}. A buyer
        paying that would be taxed on it.
      </p>
      <p className="text-[17px] leading-relaxed">
        The county taxes this house on {facts.taxedOn}.
      </p>
      <p className="text-[17px] leading-relaxed">
        That difference is {facts.benefit} a year.
      </p>
      <p className="text-[17px] leading-relaxed">
        California lets some homeowners carry this to their next home.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Link className={ctaClass} href="/sample">
          See the sample note
        </Link>
        <Link className={linkClass} href="/register">
          Create an account
        </Link>
        <Link className={linkClass} href="/login">
          Sign in
        </Link>
      </div>
    </main>
  )
}
