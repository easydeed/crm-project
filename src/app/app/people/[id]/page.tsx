import { notFound, redirect } from 'next/navigation'
import { PersonDetail } from '@/app/app/people/[id]/person-detail'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { getContactForAccount } from '@/db/contacts'
import { listGroupsForAccount } from '@/db/groups'

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

  return (
    <PersonDetail
      person={person}
      groups={groups}
      readOnly={Boolean(session.viewingAsAccountId)}
    />
  )
}
