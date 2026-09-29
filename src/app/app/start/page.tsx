import { redirect } from 'next/navigation'
import { StartFlow } from '@/app/app/start/start-flow'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { getAccountById } from '@/db/accounts'
import { START_COPY } from '@/signup/copy'

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ agent?: string }>
}) {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/start')
  const account = await getAccountById(effectiveAccountId(session))
  if (!account) redirect('/login?returnTo=/app/start')
  const params = await searchParams

  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">Add your people</h1>
      <p className="mt-3 max-w-xl text-[15px]">{START_COPY.intro}</p>
      <StartFlow
        agentName={account.name}
        initialAgentId={params.agent ?? account.mlsAgentId ?? ''}
        readOnly={Boolean(session.viewingAsAccountId)}
      />
    </main>
  )
}
