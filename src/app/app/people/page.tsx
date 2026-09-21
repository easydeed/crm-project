import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PeopleList } from '@/app/app/people/people-list'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { countContactsForAccount } from '@/db/accounts'
import { listContactsForAccount, type ContactListStatus } from '@/db/contacts'

const linkClass =
  'inline-block text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

function asStatus(value: string | undefined): ContactListStatus | undefined {
  if (value === 'matched' || value === 'needs_review' || value === 'no_parcel') {
    return value
  }
  return undefined
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/people')

  const accountId = effectiveAccountId(session)
  const status = asStatus((await searchParams).status)
  const count = await countContactsForAccount(accountId)
  const rows = await listContactsForAccount(accountId, status ? { status } : undefined)

  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">People</h1>
      <p className="mt-3">
        <Link className={linkClass} href="/app/people/import">
          Add your people
        </Link>
      </p>
      {count === 0 ? (
        <p className="mt-3 max-w-xl text-[15px]">
          No people yet. Add a list to get started.
        </p>
      ) : status === 'needs_review' && rows.length === 0 ? (
        <p className="mt-3 max-w-xl text-[15px]">No one needs a look right now.</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 max-w-xl text-[15px]">No people match that filter.</p>
      ) : (
        <>
          <p className="mt-3 max-w-xl text-[15px]">
            {status === 'needs_review'
              ? `${rows.length === 1 ? '1 person needs' : `${rows.length} people need`} a look.`
              : `${count} on your list.`}
          </p>
          <PeopleList rows={rows} />
        </>
      )}
    </main>
  )
}
