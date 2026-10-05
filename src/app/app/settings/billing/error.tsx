'use client'

import { linkClass } from '@/app/app/people/ui'

export default function BillingError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="px-4 py-10">
      <h1 className="text-[22px] font-semibold">We couldn&apos;t reach Stripe for your billing.</h1>
      <p className="mt-3 max-w-xl text-[15px]">
        Nothing about your plan changed. Try again in a minute.
      </p>
      <button
        className={`${linkClass} mt-6`}
        type="button"
        onClick={reset}
      >
        Try again
      </button>
    </main>
  )
}
