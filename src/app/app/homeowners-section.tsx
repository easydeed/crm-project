import Link from 'next/link'
import { linkClass, panelBodyClass, panelClass, panelHeaderClass } from '@/app/app/people/ui'

export function HomeownersSection() {
  return (
    <section aria-labelledby="homeowners-heading" className={panelClass}>
      <h2 className={panelHeaderClass} id="homeowners-heading">
        Your homeowners
      </h2>
      <div className={panelBodyClass}>
        <p className="max-w-xl text-[17px]">
          Everyone you&apos;ve closed with, the house they&apos;re matched to, and whether they get
          the monthly note.
        </p>
        <Link className={`mt-3 inline-block tap ${linkClass}`} href="/app/people">
          Open people
        </Link>
      </div>
    </section>
  )
}
