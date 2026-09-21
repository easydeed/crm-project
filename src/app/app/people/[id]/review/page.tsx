import { notFound, redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { getContactForAccount } from '@/db/contacts'
import { reviewQueueHref } from '@/people/url'

export default async function PersonReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/people')

  const { id } = await params
  const person = await getContactForAccount(effectiveAccountId(session), id)
  if (!person) notFound()

  redirect(reviewQueueHref(person.id))
}
