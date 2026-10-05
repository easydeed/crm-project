'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { importClosingsAction, type ImportClosingsState } from '@/app/app/start/actions'
import { buttonClass, linkClass, mutedClass } from '@/app/app/people/ui'
import { formatMoney, formatRecordedDay } from '@/digest/format'
import { MlsAttribution } from '@/digest/mls-attribution'
import { peopleListHref } from '@/people/url'
import type { SkippedRow } from '@/import/types'
import type { ClosedListing } from '@/providers/types'
import { START_COPY, addedLine, foundLine, isFew, tickedLine, confirmLabel } from '@/signup/copy'

export function ClosingsResults({
  agentName,
  agentId,
  listings,
  readOnly,
}: {
  agentName: string
  agentId: string
  listings: ClosedListing[]
  readOnly: boolean
}) {
  const [state, action, pending] = useActionState(importClosingsAction, {} as ImportClosingsState)
  const [unticked, setUnticked] = useState<Set<string>>(() => new Set())
  const ticked = listings.filter((listing) => !unticked.has(listing.mlsId))

  if (state.result) return <ClosingsAdded added={state.result.added} skipped={state.result.skipped} />

  function toggle(mlsId: string) {
    setUnticked((current) => {
      const next = new Set(current)
      if (next.has(mlsId)) next.delete(mlsId)
      else next.add(mlsId)
      return next
    })
  }

  return (
    <section aria-labelledby="closings-heading" className="mt-8 max-w-2xl">
      <h2 id="closings-heading" className="text-[22px] font-semibold">
        {agentName}
      </h2>
      <p className="mt-2 text-[15px]">{foundLine(listings.length)}</p>
      <p className="mt-3 text-[15px]">{START_COPY.listingSideNote}</p>
      {isFew(listings.length) ? (
        <p className="mt-3 text-[15px]">
          {START_COPY.fewNote}{' '}
          <a className={linkClass} href="#upload">
            {START_COPY.fewLink}
          </a>
          .
        </p>
      ) : null}
      <form action={action} className="mt-6">
        <input type="hidden" name="agentId" value={agentId} />
        <ul className="flex flex-col divide-y divide-rule border-y border-rule">
          {listings.map((listing) => {
            const checked = !unticked.has(listing.mlsId)
            return (
              <li key={listing.mlsId} className="py-3 text-[15px]">
                <label className="flex min-h-11 items-start gap-3">
                  <input
                    className="mt-1 size-4 accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    type="checkbox"
                    name="mlsId"
                    value={listing.mlsId}
                    checked={checked}
                    onChange={() => toggle(listing.mlsId)}
                  />
                  <span className="min-w-0">
                    <span className="block font-medium break-words">
                      {listing.address}, {listing.city}
                    </span>
                    <span className="block">
                      Closed {formatRecordedDay(listing.closeDate)} ·{' '}
                      {listing.closePrice == null ? 'Price not reported' : formatMoney(listing.closePrice)}
                    </span>
                    <MlsAttribution office={listing.listingOffice} agent={listing.listingAgent} variant="app" />
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
        <p className="mt-4 text-[15px]" aria-live="polite">
          {tickedLine(ticked.length, listings.length)}
        </p>
        {state.error ? (
          <p className="mt-3 text-[15px]" role="alert">
            {state.error}
          </p>
        ) : null}
        <button
          className={`${buttonClass} mt-4 max-sm:w-full`}
          type="submit"
          disabled={readOnly || pending || ticked.length === 0}
        >
          {confirmLabel(ticked.length)}
        </button>
      </form>
    </section>
  )
}

function ClosingsAdded({ added, skipped }: { added: number; skipped: SkippedRow[] }) {
  const reasons = new Map<string, number>()
  for (const row of skipped) reasons.set(row.reason, (reasons.get(row.reason) ?? 0) + 1)
  return (
    <section className="mt-8 max-w-xl" aria-live="polite">
      <h2 className="text-[18px] font-semibold">{addedLine(added)}</h2>
      {reasons.size > 0 ? (
        <ul className={`mt-3 flex flex-col gap-1 ${mutedClass}`}>
          {[...reasons].map(([reason, count]) => (
            <li key={reason}>
              {count} not added: {reason}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-4">
        <Link className={`tap ${linkClass}`} href={peopleListHref({ noEmail: true })}>
          {START_COPY.noEmailLink}
        </Link>
      </p>
    </section>
  )
}
