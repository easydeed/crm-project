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
import { PhoneVerification } from '@/app/app/settings/phone-verification'
import { loadSettingsPreview } from '@/digest/load-settings-preview'
import { linkClass, panelBodyClass, panelClass, panelHeaderClass } from '@/app/app/people/ui'

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
    <main className="px-4 pb-10 pt-5 sm:px-8 sm:pb-16 sm:pt-7">
      {/* The Settings column (OR-046): 760px. The preview sits under its form, not in a column of its own. */}
      <div className="flex max-w-[760px] flex-col gap-5 sm:gap-6">
      <h1 className="text-[22px] font-semibold sm:text-[24px]">Settings</h1>
      <DetailsForm account={account} readOnly={readOnly} />
      <PhoneVerification key={account.phone ?? 'none'} phone={account.phone} readOnly={readOnly} verified={Boolean(account.phoneVerifiedAt)} />
      <AppearanceForm account={account} readOnly={readOnly} preview={preview} />
      <SendingForm account={account} readOnly={readOnly} systemPaused={systemPaused} />
      <section aria-labelledby="billing-heading" className={panelClass}>
        <h2 className={panelHeaderClass} id="billing-heading">
          Billing
        </h2>
        <p className={`text-[15px] ${panelBodyClass}`}>
          <Link className={`tap ${linkClass}`} href="/app/settings/billing">
            Plan, card, invoices, and canceling
          </Link>
        </p>
      </section>
      </div>
    </main>
  )
}
