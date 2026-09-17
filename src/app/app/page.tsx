import Link from 'next/link'
import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { countContactsForAccount, getAccountById } from '@/db/accounts'

export default async function AppHomePage() {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app')

  const account = await getAccountById(effectiveAccountId(session))
  if (!account) {
    return (
      <main className="px-4 py-10">
        <h1 className="text-[22px] font-semibold">We could not load your account.</h1>
        <p className="mt-3 max-w-xl text-[15px]">
          Sign out and sign in again. If it keeps happening, the account may have been
          removed.
        </p>
      </main>
    )
  }

  const peopleCount = await countContactsForAccount(account.id)
  if (peopleCount === 0) {
    return (
      <main className="px-4 py-10">
        <h1 className="text-[22px] font-semibold">Let&apos;s get your people in.</h1>
        <p className="mt-3 max-w-xl text-[15px]">
          Add the folks you&apos;ve closed with and we&apos;ll match each address to the
          county record. Takes about four minutes.
        </p>
        <Link
          className="mt-6 inline-block rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/app/people"
        >
          Add your people
        </Link>
      </main>
    )
  }

  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">Your people are on file.</h1>
      <p className="mt-3 max-w-xl text-[15px]">
        Open People to review the list. Adding and matching come next.
      </p>
      <Link
        className="mt-6 inline-block rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        href="/app/people"
      >
        Open people
      </Link>
    </main>
  )
}
