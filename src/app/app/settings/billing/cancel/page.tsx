import Link from 'next/link'
import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { loadBillingView } from '@/billing/account-billing'
import { getAccountById } from '@/db/accounts'
import { cancelPlanAction } from '@/app/app/settings/billing/actions'
import { cancelSentence, formatBillingDate } from '@/app/app/settings/billing/billing-copy'
import { buttonClass, linkClass, panelBodyClass, panelClass } from '@/app/app/people/ui'

/** One screen, one decision, and the two ways out of it. */
export default async function CancelPlanPage() {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/settings/billing/cancel')
  if (session.viewingAsAccountId) redirect('/app/settings/billing')
  const accountId = effectiveAccountId(session)
  const account = await getAccountById(accountId)
  const view = await loadBillingView(accountId)
  if (!account || view.kind !== 'subscribed' || view.status !== 'active' || view.cancelAtPeriodEnd || !view.currentPeriodEnd) {
    redirect('/app/settings/billing')
  }

  return (
    <main className="px-4 pb-10 pt-5 sm:px-8 sm:pb-16 sm:pt-7">
      <div className="max-w-[760px]">
      <h1 className="text-[22px] font-semibold sm:text-[24px]">Cancel your plan</h1>
      {/* One plain panel (OR-046). Not sendCardClass: that is the dashboard's send card. */}
      <section aria-label="Cancel your plan" className={`mt-5 ${panelClass} ${panelBodyClass}`}>
      <p className="max-w-xl text-[15px]">
        {cancelSentence(formatBillingDate(view.currentPeriodEnd, account.timezone))}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-6">
        <form action={cancelPlanAction}>
          <button className={buttonClass} type="submit">
            Cancel my plan
          </button>
        </form>
        <Link className={`tap ${linkClass}`} href="/app/settings/billing">
          Keep my plan
        </Link>
      </div>
      </section>
      </div>
    </main>
  )
}
