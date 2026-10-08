import { notFound, redirect } from 'next/navigation'
import { panelBodyClass, panelClass } from '@/app/app/people/ui'
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
    <main className="px-4 pb-10 pt-5 sm:px-8 sm:pb-16 sm:pt-7">
      <div className="max-w-[760px]">
        <h1 className="text-[22px] font-semibold sm:text-[24px]">Edit {person.name}</h1>
        {/* One plain panel (OR-045). The design titles it "Their details"; the screen adds no words. */}
        <section aria-label={`Edit ${person.name}`} className={`mt-5 ${panelClass}`}>
          <div className={panelBodyClass}>
            <PersonForm person={person} readOnly={Boolean(session.viewingAsAccountId)} />
          </div>
        </section>
      </div>
    </main>
  )
}
