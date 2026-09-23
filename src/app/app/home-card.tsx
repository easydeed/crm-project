import Link from 'next/link'
import {
  resumeMonthAction,
  skipMonthAction,
  unpauseAction,
} from '@/app/app/send-actions'
import type { HomeSend } from '@/app/app/home-send'

const buttonClass =
  'mt-6 inline-block rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
const linkClass =
  'text-[15px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

function Action({ action, label }: { action: () => Promise<void>; label: string }) {
  return (
    <form action={action}>
      <button className={buttonClass} type="submit">
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
  if (view.kind === 'system-paused') {
    return (
      <main className="px-4 py-10">
        <h1 className="text-[22px] font-semibold">We paused your monthly note.</h1>
        <p className="mt-3 max-w-xl text-[15px]">
          A few people marked it as spam, so we stopped to protect everyone&apos;s
          delivery.{' '}
          <a className={linkClass} href="mailto:">
            Contact us
          </a>
        </p>
      </main>
    )
  }

  if (view.kind === 'paused') {
    return (
      <main className="px-4 py-10">
        <h1 className="text-[22px] font-semibold">Your monthly note is paused.</h1>
        <p className="mt-3 max-w-xl text-[15px]">Nothing sends until you turn it back on.</p>
        {readOnly ? null : <Action action={unpauseAction} label="Unpause" />}
      </main>
    )
  }

  if (view.kind === 'settings') {
    return (
      <main className="px-4 py-10">
        <h1 className="text-[22px] font-semibold">Set when the note goes out.</h1>
        <p className="mt-3 max-w-xl text-[15px]">
          Pick a send day, a time, and a timezone.
        </p>
        <Link className={buttonClass} href="/app/settings">
          Open settings
        </Link>
      </main>
    )
  }

  if (view.kind === 'import') {
    return (
      <main className="px-4 py-10">
        <h1 className="text-[22px] font-semibold">Let&apos;s get your people in.</h1>
        <p className="mt-3 max-w-xl text-[15px]">
          Add the folks you&apos;ve closed with and we&apos;ll match each address to the
          county record. Takes about four minutes.
        </p>
        <Link className={buttonClass} href="/app/people/import">
          Add your people
        </Link>
      </main>
    )
  }

  if (view.kind === 'review') {
    return (
      <main className="px-4 py-10">
        <h1 className="text-[22px] font-semibold">Some addresses still need a house.</h1>
        <p className="mt-3 max-w-xl text-[15px]">
          The monthly note only goes to people matched to a county record.
        </p>
        <Link className={buttonClass} href="/app/people/review">
          Open the review queue
        </Link>
      </main>
    )
  }

  if (view.kind === 'none-subscribed') {
    return (
      <main className="px-4 py-10">
        <h1 className="text-[22px] font-semibold">No one is set to get the monthly note.</h1>
        <p className="mt-3 max-w-xl text-[15px]">
          People need a matched house and an active monthly note.
        </p>
        <Link className={buttonClass} href="/app/people">
          Open people
        </Link>
      </main>
    )
  }

  if (view.kind === 'skipped') {
    return (
      <main className="px-4 py-10">
        <h1 className="text-[22px] font-semibold">Skipped.</h1>
        <p className="mt-3 max-w-xl text-[15px]">
          The {view.when} note will not go out.
        </p>
        {readOnly ? null : <Action action={resumeMonthAction} label="Resume" />}
      </main>
    )
  }

  if (view.kind !== 'scheduled') return null

  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">{view.sentence}</h1>
      <div className="mt-6 flex flex-wrap items-center gap-6">
        {view.previewContactId ? (
          <Link className={linkClass} href={`/app/people/${view.previewContactId}`}>
            Preview it
          </Link>
        ) : null}
        {readOnly ? null : <Action action={skipMonthAction} label="Skip this month" />}
      </div>
    </main>
  )
}
