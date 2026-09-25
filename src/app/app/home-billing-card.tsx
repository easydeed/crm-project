import Link from 'next/link'
import type { BillingIssue } from '@/billing/status'

const buttonClass =
  'mt-6 inline-block rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

const COPY: Record<BillingIssue, { title: string; body: string; action: string }> = {
  no_subscription: {
    title: 'Start your plan to send the monthly note.',
    body: 'Everything you set up stays here. Nothing goes to your homeowners until the plan is active.',
    action: 'Start your plan',
  },
  past_due: {
    title: 'Your last payment did not go through.',
    body: 'The monthly note is on hold until the open invoice is paid. Your people and your call list are all still here.',
    action: 'Open billing',
  },
  canceled: {
    title: 'Your plan has ended.',
    body: 'Your homeowners are not getting the monthly note. Your people and their matches are still here.',
    action: 'Restart your plan',
  },
  inactive: {
    title: 'Your plan is not active.',
    body: 'The monthly note is on hold. Your people and your call list are all still here.',
    action: 'Open billing',
  },
}

/** Shown in place of the send status when the subscription does not allow sending. */
export function HomeBillingCard({ issue }: { issue: BillingIssue }) {
  const copy = COPY[issue]
  return (
    <section className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">{copy.title}</h1>
      <p className="mt-3 max-w-xl text-[15px]">{copy.body}</p>
      <Link className={buttonClass} href="/app/settings/billing">
        {copy.action}
      </Link>
    </section>
  )
}
