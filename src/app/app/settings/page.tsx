import Link from 'next/link'
import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { getAccountById } from '@/db/accounts'
import { systemPauseState } from '@/db/system-pause'
import { getRuntimeDb } from '@/db/runtime'
import { AppearanceForm } from '@/app/app/settings/appearance-form'
import { DetailsForm } from '@/app/app/settings/details-form'
import { SendingForm } from '@/app/app/settings/sending-form'
import { loadSettingsPreview } from '@/digest/load-settings-preview'

export default async function SettingsPage() {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/settings')

  const accountId = effectiveAccountId(session)
  const account = await getAccountById(accountId)
  if (!account) {
    return (
      <main className="px-4 py-10">
        <h1 className="text-[22px] font-semibold">We could not load your settings.</h1>
        <p className="mt-3 max-w-xl text-[15px]">
          Sign out and sign in again. If it keeps happening, the account may have been
          removed.
        </p>
      </main>
    )
  }

  const { db } = getRuntimeDb()
  const preview = await loadSettingsPreview(db, accountId, new Date())
  const readOnly = Boolean(session.viewingAsAccountId)
  const systemPaused = await systemPauseState(accountId)
  return (
    <main className="flex flex-col gap-10 px-4 py-10">
      <h1 className="text-[22px] font-semibold">Settings</h1>
      <DetailsForm account={account} readOnly={readOnly} />
      <AppearanceForm account={account} readOnly={readOnly} preview={preview} />
      <SendingForm account={account} readOnly={readOnly} systemPaused={systemPaused} />
      <section>
        <h2 className="text-[17px] font-semibold">Billing</h2>
        <p className="mt-2 text-[15px]">
          <Link
            className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            href="/app/settings/billing"
          >
            Plan, card, invoices, and canceling
          </Link>
        </p>
      </section>
    </main>
  )
}
