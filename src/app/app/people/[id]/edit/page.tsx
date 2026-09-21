import { notFound, redirect } from 'next/navigation'
import { PersonForm } from '@/app/app/people/[id]/edit/person-form'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { getContactForAccount } from '@/db/contacts'

export default async function EditPersonPage({
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
      <h1 className="text-[22px] font-semibold">Edit {person.name}</h1>
      <PersonForm person={person} readOnly={Boolean(session.viewingAsAccountId)} />
    </main>
  )
}
