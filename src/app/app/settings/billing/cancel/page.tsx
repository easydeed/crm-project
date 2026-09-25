import Link from 'next/link'
import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { loadBillingView } from '@/billing/account-billing'
import { getAccountById } from '@/db/accounts'
import { cancelPlanAction } from '@/app/app/settings/billing/actions'
import { cancelSentence, formatBillingDate } from '@/app/app/settings/billing/billing-copy'

const buttonClass =
  'rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
const linkClass =
  'text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

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
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">Cancel your plan</h1>
      <p className="mt-3 max-w-xl text-[15px]">
        {cancelSentence(formatBillingDate(view.currentPeriodEnd, account.timezone))}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-6">
        <form action={cancelPlanAction}>
          <button className={buttonClass} type="submit">
            Cancel my plan
          </button>
        </form>
        <Link className={linkClass} href="/app/settings/billing">
          Keep my plan
        </Link>
      </div>
    </main>
  )
}
