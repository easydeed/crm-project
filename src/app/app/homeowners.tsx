import Link from 'next/link'
import { linkClass } from '@/app/app/people/ui'

export function HomeownersSummary({
  people,
  more,
}: {
  people: { id: string; name: string; address: string }[]
  more: boolean
}) {
  return (
    <section className="mt-10">
      <h2 className="text-[22px] font-semibold">Your homeowners</h2>
      {people.length === 0 ? (
        <p className="mt-3 text-[15px]">No one here yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {people.map((person) => (
            <li key={person.id} className="text-[15px]">
              <Link className={linkClass} href={`/app/people/${person.id}`}>
                {person.name}
              </Link>
              <p>{person.address}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4">
        <Link className={linkClass} href="/app/people">
          {more ? 'See everyone' : 'Open your people'}
        </Link>
      </p>
    </section>
  )
}
