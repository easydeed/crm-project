import Link from 'next/link'
import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { loadBillingView } from '@/billing/account-billing'
import { getAccountById } from '@/db/accounts'
import { resumePlanAction, startCheckoutAction } from '@/app/app/settings/billing/actions'
import { formatBillingDate, NOTICES, PLAN_LINE, statusWords } from '@/app/app/settings/billing/billing-copy'
import { InvoiceList } from '@/app/app/settings/billing/invoice-list'

const buttonClass =
  'rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
const linkClass =
  'text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

function Action({ action, label }: { action: () => Promise<void>; label: string }) {
  return (
    <form action={action} className="mt-6">
      <button className={buttonClass} type="submit">
        {label}
      </button>
    </form>
  )
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/settings/billing')
  const accountId = effectiveAccountId(session)
  const account = await getAccountById(accountId)
  if (!account) redirect('/app/settings')
  const readOnly = Boolean(session.viewingAsAccountId)
  const params = await searchParams
  const notice = Object.entries(params).map(([key, value]) => NOTICES[`${key}=${value}`]).find(Boolean)
  const view = await loadBillingView(accountId)
  const tz = account.timezone

  return (
    <main className="flex flex-col gap-8 px-4 py-10">
      <div>
        <Link className={linkClass} href="/app/settings">
          Settings
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold">Billing</h1>
        {notice ? <p className="mt-3 max-w-xl text-[15px]" role="status">{notice}</p> : null}
      </div>

      {view.kind === 'none' ? (
        <section>
          <h2 className="text-[17px] font-semibold">You don&apos;t have a plan yet.</h2>
          <p className="mt-2 max-w-xl text-[15px]">
            {PLAN_LINE}. Your homeowners start getting the monthly note once the plan is active.
          </p>
          {readOnly ? null : <Action action={startCheckoutAction} label="Start your plan" />}
        </section>
      ) : (
        <>
          <section className="text-[15px]">
            <h2 className="text-[17px] font-semibold">Your plan</h2>
            <dl className="mt-3 grid max-w-xl grid-cols-[auto_1fr] gap-x-6 gap-y-2">
              <dt>Plan</dt>
              <dd>{PLAN_LINE}</dd>
              <dt>Status</dt>
              <dd>{statusWords(view.status, view.cancelAtPeriodEnd)}</dd>
              {view.status === 'active' && view.currentPeriodEnd ? (
                <>
                  <dt>{view.cancelAtPeriodEnd ? 'Ends' : 'Next charge'}</dt>
                  <dd>{formatBillingDate(view.currentPeriodEnd, tz)}</dd>
                </>
              ) : null}
              <dt>Card</dt>
              <dd>{view.cardLast4 ? `Ending in ${view.cardLast4}` : 'No card on file'}</dd>
            </dl>
            {readOnly ? null : <PlanActions view={view} />}
          </section>
          <section>
            <h2 className="text-[17px] font-semibold">Invoices</h2>
            <InvoiceList invoices={view.invoices} timezone={tz} />
          </section>
        </>
      )}
    </main>
  )
}

function PlanActions({ view }: { view: Extract<Awaited<ReturnType<typeof loadBillingView>>, { kind: 'subscribed' }> }) {
  if (view.status === 'active' && view.cancelAtPeriodEnd) return <Action action={resumePlanAction} label="Keep my plan" />
  if (view.status === 'active') {
    return (
      <p className="mt-6">
        <Link className={linkClass} href="/app/settings/billing/cancel">
          Cancel my plan
        </Link>
      </p>
    )
  }
  if (view.status === 'past_due') {
    return <p className="mt-6 max-w-xl text-[15px]">Pay the open invoice below to start sending again.</p>
  }
  return <Action action={startCheckoutAction} label="Restart your plan" />
}
