import Link from 'next/link'
import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { loadBillingView } from '@/billing/account-billing'
import { getAccountById } from '@/db/accounts'
import { resumePlanAction, startCheckoutAction } from '@/app/app/settings/billing/actions'
import { formatBillingDate, NOTICES, PLAN_LINE, statusWords } from '@/app/app/settings/billing/billing-copy'
import { InvoiceList } from '@/app/app/settings/billing/invoice-list'
import { DetailsRow, DetailsTable } from '@/app/app/details-table'
import { buttonClass, linkClass, panelBodyClass, panelClass, panelHeaderClass } from '@/app/app/people/ui'

/** The plan table's label column: 120px at 390, 160px from sm, as drawn. */
const LABELS = 'grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr]'

function Action({ action, label }: { action: () => Promise<void>; label: string }) {
  return (
    <form action={action}>
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
    <main className="px-4 pb-10 pt-5 sm:px-8 sm:pb-16 sm:pt-7">
      {/* The Billing column (OR-046): 760px, local. Statuses stay plain words: the design coloured two of them. */}
      <div className="flex max-w-[760px] flex-col gap-5 sm:gap-6">
      <div>
        <Link className={`tap ${linkClass}`} href="/app/settings">
          Settings
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold sm:text-[24px]">Billing</h1>
        {notice ? <p className="mt-3 max-w-xl text-[15px]" role="status">{notice}</p> : null}
      </div>

      {view.kind === 'none' ? (
        <section className={`${panelClass} ${panelBodyClass}`}>
          <h2 className="text-[17px] font-semibold">You don&apos;t have a plan yet.</h2>
          <p className="mt-2 max-w-xl text-[15px]">
            {PLAN_LINE}. Your homeowners start getting the monthly note once the plan is active.
          </p>
          {readOnly ? null : (
            <div className="mt-5">
              <Action action={startCheckoutAction} label="Start your plan" />
            </div>
          )}
        </section>
      ) : (
        <>
          <section aria-labelledby="plan-heading" className={`text-[15px] ${panelClass}`}>
            <h2 className={panelHeaderClass} id="plan-heading">
              Your plan
            </h2>
            <DetailsTable flush>
              <DetailsRow label="Plan" labels={LABELS}>
                {PLAN_LINE}
              </DetailsRow>
              <DetailsRow label="Status" labels={LABELS}>
                {statusWords(view.status, view.cancelAtPeriodEnd)}
              </DetailsRow>
              {view.status === 'active' && view.currentPeriodEnd ? (
                <DetailsRow label={view.cancelAtPeriodEnd ? 'Ends' : 'Next charge'} labels={LABELS}>
                  {formatBillingDate(view.currentPeriodEnd, tz)}
                </DetailsRow>
              ) : null}
              <DetailsRow label="Card" labels={LABELS}>
                {view.cardLast4 ? `Ending in ${view.cardLast4}` : 'No card on file'}
              </DetailsRow>
            </DetailsTable>
            {readOnly ? null : (
              <div className={`border-t border-rule ${panelBodyClass}`}>
                <PlanActions view={view} />
              </div>
            )}
          </section>
          <section aria-labelledby="invoices-heading" className={panelClass}>
            <h2 className={panelHeaderClass} id="invoices-heading">
              Invoices
            </h2>
            <InvoiceList invoices={view.invoices} timezone={tz} />
          </section>
        </>
      )}
      </div>
    </main>
  )
}

function PlanActions({ view }: { view: Extract<Awaited<ReturnType<typeof loadBillingView>>, { kind: 'subscribed' }> }) {
  if (view.status === 'active' && view.cancelAtPeriodEnd) return <Action action={resumePlanAction} label="Keep my plan" />
  if (view.status === 'active') {
    return (
      <p>
        <Link className={`tap ${linkClass}`} href="/app/settings/billing/cancel">
          Cancel my plan
        </Link>
      </p>
    )
  }
  if (view.status === 'past_due') {
    return <p className="max-w-xl text-[15px]">Pay the open invoice below to start sending again.</p>
  }
  return <Action action={startCheckoutAction} label="Restart your plan" />
}
