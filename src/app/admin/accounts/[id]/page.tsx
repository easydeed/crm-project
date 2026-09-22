import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { getAccountById } from '@/db/accounts'
import { formatAdminDate } from '@/app/admin/accounts/format'
import { ViewAsButton } from '@/app/admin/accounts/view-as-button'
import { SettingsReadout } from '@/app/app/settings/readout'

export default async function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/admin/accounts')

  const { id } = await params
  const account = await getAccountById(id)
  if (!account) notFound()

  return (
    <main className="px-4 py-10">
      <p className="text-[15px]">
        <Link
          className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/admin/accounts"
        >
          All accounts
        </Link>
      </p>
      <header className="mt-6 flex max-w-xl flex-col gap-2">
        <h1 className="text-[22px] font-semibold">{account.name}</h1>
        <p className="text-[15px]">{account.email}</p>
        <p className="text-[15px]">{account.brokerage ?? '—'}</p>
        <p className="text-[15px]">DRE {account.dre ?? '—'}</p>
        <p className="text-[15px]">Signed up {formatAdminDate(account.createdAt)}</p>
        <p className="text-[15px]">{account.role}</p>
      </header>
      <div className="mt-10">
        <SettingsReadout account={account} />
      </div>
      <p className="mt-6">
        <Link
          className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          href={`/admin/preview?account=${account.id}`}
        >
          Preview this account&apos;s notes
        </Link>
      </p>
      {account.role === 'agent' ? <ViewAsButton accountId={account.id} /> : null}
    </main>
  )
}
