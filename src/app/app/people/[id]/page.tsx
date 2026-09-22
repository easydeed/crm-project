import { notFound, redirect } from 'next/navigation'
import { DigestPreviewPanel } from '@/app/digest/preview-panel'
import { PersonDetail } from '@/app/app/people/[id]/person-detail'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { getContactForAccount } from '@/db/contacts'
import { listGroupsForAccount } from '@/db/groups'
import { getRuntimeDb } from '@/db/runtime'
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
  const input = await buildDigestInput(db, accountId, person.id, new Date())
  const preview = input
    ? renderDigest(input)
    : { send: false as const, reason: UNMATCHED_REASON }

  return (
    <>
      <PersonDetail
        person={person}
        groups={groups}
        readOnly={Boolean(session.viewingAsAccountId)}
      />
      <div className="px-4 pb-10">
        <DigestPreviewPanel title="Preview their email" result={preview} />
      </div>
    </>
  )
}
