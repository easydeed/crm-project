import Link from 'next/link'
import {
  resumeMonthAction,
  skipMonthAction,
  unpauseAction,
} from '@/app/app/send-actions'
import type { HomeSend } from '@/app/app/home-send'
import { HomeBillingCard } from '@/app/app/home-billing-card'
import { buttonClass, linkClass, sendCardClass, sendCardHeadingClass } from '@/app/app/people/ui'
import { pausedAccountMailto } from '@/config/support'

const ctaClass = `${buttonClass} mt-6 inline-block`

function Action({ action, label }: { action: () => Promise<void>; label: string }) {
  return (
    <form action={action}>
      <button className={ctaClass} type="submit">
        {label}
      </button>
    </form>
  )
}

export function HomeSendCard({
  view,
  readOnly,
}: {
  view: HomeSend
  readOnly: boolean
}) {
  if (view.kind === 'billing') return <HomeBillingCard issue={view.issue} />

  if (view.kind === 'system-paused') {
    return (
      <section className={sendCardClass}>
        <h1 className={sendCardHeadingClass}>We paused your monthly note.</h1>
        <p className="mt-3 max-w-xl text-[15px]">
          A few people marked it as spam, so we stopped to protect everyone&apos;s
          delivery.{' '}
          <a className={linkClass} href={pausedAccountMailto(view.accountId)}>
            Contact us
          </a>
        </p>
      </section>
    )
  }

  if (view.kind === 'paused') {
    return (
      <section className={sendCardClass}>
        <h1 className={sendCardHeadingClass}>Your monthly note is paused.</h1>
        <p className="mt-3 max-w-xl text-[15px]">Nothing sends until you turn it back on.</p>
        {readOnly ? null : <Action action={unpauseAction} label="Unpause" />}
      </section>
    )
  }

  if (view.kind === 'settings') {
    return (
      <section className={sendCardClass}>
        <h1 className={sendCardHeadingClass}>Set when the note goes out.</h1>
        <p className="mt-3 max-w-xl text-[15px]">
          Pick a send day, a time, and a timezone.
        </p>
        <Link className={`${ctaClass} tap`} href="/app/settings">
          Open settings
        </Link>
      </section>
    )
  }

  if (view.kind === 'import') {
    return (
      <section className={sendCardClass}>
        <h1 className={sendCardHeadingClass}>Let&apos;s get your people in.</h1>
        <p className="mt-3 max-w-xl text-[15px]">
          Add the folks you&apos;ve closed with and we&apos;ll match each address to the
          county record. Takes about four minutes.
        </p>
        <Link className={`${ctaClass} tap`} href="/app/people/import">
          Add your people
        </Link>
      </section>
    )
  }

  if (view.kind === 'review') {
    return (
      <section className={sendCardClass}>
        <h1 className={sendCardHeadingClass}>Some addresses still need a house.</h1>
        <p className="mt-3 max-w-xl text-[15px]">
          The monthly note only goes to people matched to a county record.
        </p>
        <Link className={`${ctaClass} tap`} href="/app/people/review">
          Open the review queue
        </Link>
      </section>
    )
  }

  if (view.kind === 'none-subscribed') {
    return (
      <section className={sendCardClass}>
        <h1 className={sendCardHeadingClass}>No one is set to get the monthly note.</h1>
        <p className="mt-3 max-w-xl text-[15px]">
          People need a matched house and an active monthly note.
        </p>
        <Link className={`${ctaClass} tap`} href="/app/people">
          Open people
        </Link>
      </section>
    )
  }

  if (view.kind === 'skipped') {
    return (
      <section className={sendCardClass}>
        <h1 className={sendCardHeadingClass}>Skipped.</h1>
        <p className="mt-3 max-w-xl text-[15px]">
          The {view.when} note will not go out.
        </p>
        {readOnly ? null : <Action action={resumeMonthAction} label="Resume" />}
      </section>
    )
  }

  if (view.kind !== 'scheduled') return null

  return (
    <section className={sendCardClass}>
      <h1 className={sendCardHeadingClass}>{view.sentence}</h1>
      {/* OR-044: the safe action is the button. Skip stays a form button, styled as a link: an <a>
          can't post, so a link here would be a dead control. */}
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        {view.previewContactId ? (
          <Link className={`${buttonClass} tap inline-flex items-center`} href={`/app/people/${view.previewContactId}`}>
            Preview it
          </Link>
        ) : null}
        {readOnly ? null : (
          <form action={skipMonthAction}>
            <button className={`${linkClass} min-h-11`} type="submit">
              Skip this month
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
