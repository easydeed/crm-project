import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { ImportForm } from '@/app/app/people/import/import-form'

export default async function ImportPeoplePage() {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/people/import')

  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">Add your people</h1>
      <p className="mt-3 max-w-xl text-[15px]">
        Upload a file or paste a list. We match each address to the county record.
      </p>
      <ImportForm readOnly={Boolean(session.viewingAsAccountId)} />
    </main>
  )
}
