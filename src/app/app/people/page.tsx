import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { countContactsForAccount } from '@/db/accounts'

export default async function PeoplePage() {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/people')

  const count = await countContactsForAccount(effectiveAccountId(session))
  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">People</h1>
      {count === 0 ? (
        <p className="mt-3 max-w-xl text-[15px]">
          No people yet. Adding a list is the next step.
        </p>
      ) : (
        <p className="mt-3 max-w-xl text-[15px]">
          Your people are on file. The full list arrives in a later step.
        </p>
      )}
    </main>
  )
}
