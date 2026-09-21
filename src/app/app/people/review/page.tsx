import { notFound, redirect } from 'next/navigation'
import { ReviewQueue } from '@/app/app/people/review/review-queue'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import {
  countLeftOutForAccount,
  listReviewQueueForAccount,
  loadWrongHouseReview,
} from '@/db/review-queue'

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ contact?: string; mode?: string }>
}) {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/people/review')

  const accountId = effectiveAccountId(session)
  const params = await searchParams
  const contactId = params.contact
  const wrongHouse = params.mode === 'wrong-house'
  const leftOutCount = await countLeftOutForAccount(accountId)

  if (wrongHouse) {
    if (!contactId) notFound()
    const item = await loadWrongHouseReview(accountId, contactId)
    if (!item) notFound()
    return (
      <ReviewQueue
        items={[item]}
        startIndex={0}
        leftOutCount={leftOutCount}
        readOnly={Boolean(session.viewingAsAccountId)}
        mode="wrong-house"
      />
    )
  }

  const items = await listReviewQueueForAccount(accountId)
  const startIndex = contactId
    ? Math.max(items.findIndex((item) => item.id === contactId), 0)
    : 0

  return (
    <ReviewQueue
      items={items}
      startIndex={startIndex}
      leftOutCount={leftOutCount}
      readOnly={Boolean(session.viewingAsAccountId)}
    />
  )
}
