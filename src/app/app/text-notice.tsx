import Link from 'next/link'
import type { TextNotice } from '@/text/text-notice'

const linkClass = 'underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

/** One plain line when texting the call list stopped on its own. */
export function TextNoticeLine({ notice }: { notice: TextNotice }) {
  if (!notice) return null
  return (
    <p className="mt-2 max-w-xl text-[15px]" role="status">
      {notice === 'stopped' ? (
        <>
          You replied STOP, so we stopped texting you. Turn it back on{' '}
          <Link className={linkClass} href="/app/addons">
            here
          </Link>{' '}
          and confirm your number again.
        </>
      ) : (
        <>
          Your phone stopped taking our texts, so we turned off Text me the call list. Check your number in{' '}
          <Link className={linkClass} href="/app/settings#phone">
            Settings
          </Link>{' '}
          and confirm it again.
        </>
      )}
    </p>
  )
}
