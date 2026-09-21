import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { getContactForAccount } from '@/db/contacts'

const linkClass =
  'text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

export default async function PersonReviewStubPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/people')

  const { id } = await params
  const person = await getContactForAccount(effectiveAccountId(session), id)
  if (!person) notFound()

  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">Review this match</h1>
      <p className="mt-3 max-w-xl text-[15px]">
        Next we&apos;ll show the houses that could be {person.name}&apos;s and you pick
        the right one. That step is not built yet.
      </p>
      <p className="mt-6 flex flex-col gap-3">
        <Link className={linkClass} href={`/app/people/${person.id}`}>
          Back to {person.name}
        </Link>
        <Link className={linkClass} href={`/app/people/${person.id}/edit`}>
          Fix the address
        </Link>
      </p>
    </main>
  )
}
