import { eq } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import { DigestPreviewPanel } from '@/app/digest/preview-panel'
import { PersonDetail } from '@/app/app/people/[id]/person-detail'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { isTimezone } from '@/config/settings'
import { listCalledDates } from '@/db/call-log'
import { getContactForAccount } from '@/db/contacts'
import { listGroupsForAccount } from '@/db/groups'
import { getRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'
import { buildDigestInput } from '@/digest/build-input'
import { renderDigest } from '@/digest/render'
import { UNMATCHED_REASON } from '@/digest/skip-copy'

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/people')

  const { id } = await params
  const accountId = effectiveAccountId(session)
  const person = await getContactForAccount(accountId, id)
  if (!person) notFound()
  const groups = await listGroupsForAccount(accountId)

  const { db } = getRuntimeDb()
  const [account] = await db
    .select({ timezone: accounts.timezone })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1)
  const timeZone = account?.timezone && isTimezone(account.timezone) ? account.timezone : 'America/Los_Angeles'
  const day = new Intl.DateTimeFormat('en-US', { timeZone, month: 'long', day: 'numeric', year: 'numeric' })
  const calledOn = (await listCalledDates(accountId, person.id)).map((at) => day.format(at))
  const input = await buildDigestInput(db, accountId, person.id, new Date())
  const preview = input
    ? renderDigest(input)
    : { send: false as const, reason: UNMATCHED_REASON }

  return (
    <>
      <PersonDetail
        person={person}
        groups={groups}
        calledOn={calledOn}
        readOnly={Boolean(session.viewingAsAccountId)}
      />
      <div className="px-4 pb-10">
        <DigestPreviewPanel title="Preview their email" result={preview} />
      </div>
    </>
  )
}
