import Link from 'next/link'
import { inlineLinkClass } from '@/app/app/people/ui'
import type { TextNotice } from '@/text/text-notice'

/** One plain line when texting the call list stopped on its own. */
export function TextNoticeLine({ notice }: { notice: TextNotice }) {
  if (!notice) return null
  return (
    <p className="max-w-xl text-[15px]" role="status">
      {notice === 'billing_pending' || notice === 'billing_failed' ? (
        <>Texts are paused, but {notice === 'billing_failed' ? 'we could not turn off the paid add-on' : 'the paid add-on switch-off is still pending'}. <Link className={inlineLinkClass} href="/app/settings/billing#texting-recovery">{notice === 'billing_failed' ? 'Retry the switch-off in Billing' : 'View switch-off progress in Billing'}</Link>.</>
      ) : notice === 'stopped' ? (
        <>
          You replied STOP, so we stopped texting you. Turn it back on{' '}
          <Link className={inlineLinkClass} href="/app/addons">
            here
          </Link>{' '}
          and confirm your number again.
        </>
      ) : (
        <>
          Your phone stopped taking our texts, so we turned off Text me the call list. Check your number in{' '}
          <Link className={inlineLinkClass} href="/app/settings#phone">
            Settings
          </Link>{' '}
          and confirm it again.
        </>
      )}
    </p>
  )
}
