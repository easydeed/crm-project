'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { AddToGroup } from '@/app/app/people/[id]/add-to-group'
import { deleteContactAction, type ContactFormState } from '@/app/app/people/actions'
import { DetailsRow, DetailsTable } from '@/app/app/details-table'
import { STATUS_TAG_CLASS } from '@/app/app/people/status-tag'
import { buttonClass, destructiveButtonClass, linkClass, panelBodyClass, panelClass, panelHeaderClass } from '@/app/app/people/ui'
import { formatUsPhone } from '@/config/phone'
import { VIEW_AS_READ_ONLY } from '@/auth/write-guard'
import type { ContactListRow } from '@/db/contacts'
import type { GroupListRow } from '@/db/groups'
import { REVIEW_WRONG_HOUSE } from '@/people/review-copy'
import { contactStatusLabel } from '@/people/status'
import { reviewQueueHref } from '@/people/url'

/** The details table's label column: 104px at 390, 140px from sm, as drawn. */
const LABELS = 'grid-cols-[104px_1fr] sm:grid-cols-[140px_1fr]'

function phoneDisplay(phone: string | null) {
  if (!phone) return 'None on file'
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10 ? formatUsPhone(digits) : phone
}

export function PersonDetail({
  person,
  groups,
  calledOn,
  readOnly,
}: {
  person: ContactListRow
  groups: GroupListRow[]
  calledOn: string[]
  readOnly: boolean
}) {
  const [state, action] = useActionState(deleteContactAction, {} as ContactFormState)

  // Mobile order follows the design at 390: Edit and Delete sit under "On the record". From sm,
  // they move up beside the name (D:693). The grid's order classes do it with one copy of each.
  return (
    <main className="px-4 pb-5 pt-5 sm:px-8 sm:pb-6 sm:pt-7">
      <div className="grid max-w-[760px] grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-6">
        <p className="sm:col-span-2">
          <Link className={`tap ${linkClass}`} href="/app/people">
            Back to your people
          </Link>
        </p>
        <div className="flex flex-wrap items-center gap-3 sm:col-start-1 sm:row-start-2">
          <h1 className="text-[22px] font-semibold sm:text-[24px]">{person.name}</h1>
          <span className={STATUS_TAG_CLASS[person.status]}>{contactStatusLabel(person.status)}</span>
        </div>
        <div className="order-2 sm:order-none sm:col-start-2 sm:row-start-2">
          <p className="flex flex-wrap gap-3">
            <Link className={`${buttonClass} tap inline-flex items-center`} href={`/app/people/${person.id}/edit`}>
              Edit
            </Link>
            <form
              action={action}
              onSubmit={(event) => {
                if (!window.confirm(`Delete ${person.name}? They'll stop getting the monthly note. If you import them again later, they'll come back.`)) {
                  event.preventDefault()
                }
              }}
            >
              <input type="hidden" name="contactId" value={person.id} />
              <button className={destructiveButtonClass} type="submit" disabled={readOnly}>
                Delete
              </button>
            </form>
          </p>
          {readOnly ? <p className="mt-3 text-[15px]">{VIEW_AS_READ_ONLY}</p> : null}
          {state.error ? (
            <p className="mt-3 text-[15px]" role="alert">
              {state.error}
            </p>
          ) : null}
        </div>
        <section aria-label="Their details" className="order-1 text-[17px] sm:order-none sm:col-span-2">
          <DetailsTable>
            <DetailsRow label="Email" labels={LABELS}>
              {person.email ?? "None yet. We can't send without one."}
            </DetailsRow>
            <DetailsRow label="Phone" labels={LABELS}>
              {phoneDisplay(person.phone)}
            </DetailsRow>
            <DetailsRow label="Address" labels={LABELS}>
              {person.addressRaw}
              {person.homeownerAddressAt ? (
                <span className="mt-1 block">
                  Updated by the homeowner on{' '}
                  {new Intl.DateTimeFormat('en-US', {
                    timeZone: 'America/Los_Angeles',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(person.homeownerAddressAt)}
                  .
                </span>
              ) : null}
            </DetailsRow>
            <DetailsRow label="Close date" labels={LABELS}>
              {person.closeDate ?? 'None on file'}
            </DetailsRow>
            <DetailsRow label="Notes" labels={LABELS}>
              {person.notes ?? 'None on file'}
            </DetailsRow>
            <DetailsRow label="Match" labels={LABELS}>
              {contactStatusLabel(person.status)}
            </DetailsRow>
            <DetailsRow label="Calls" labels={LABELS}>
              {calledOn.length
                ? calledOn.map((day) => (
                    <span className="block" key={day}>
                      You called them on {day}.
                    </span>
                  ))
                : 'None marked yet. Mark a call from your home page.'}
            </DetailsRow>
            <DetailsRow label="Groups" labels={LABELS}>
              {person.groupNames.length ? person.groupNames.join(', ') : 'None yet'}
            </DetailsRow>
          </DetailsTable>
        </section>
        {person.status === 'matched' ? (
          <section aria-labelledby="record-heading" className={`order-1 sm:order-none sm:col-span-2 ${panelClass}`}>
            <h2 className={panelHeaderClass} id="record-heading">
              On the record
            </h2>
            <div className={`text-[17px] ${panelBodyClass}`}>
              <p>
                {person.parcelAddress ?? 'the matched house'}
                {person.parcelApn ? ` · APN ${person.parcelApn}` : ''}
              </p>
              <p className="mt-2">
                <Link className={`tap ${linkClass}`} href={reviewQueueHref(person.id, 'wrong-house')}>
                  {REVIEW_WRONG_HOUSE}
                </Link>
              </p>
            </div>
          </section>
        ) : null}
        {person.status === 'needs_review' ? (
          <p className="order-1 sm:order-none sm:col-span-2">
            <Link className={`tap ${linkClass}`} href={`/app/people/${person.id}/review`}>
              Review this match
            </Link>
          </p>
        ) : null}
        {person.status === 'no_parcel' ? (
          <p className="order-1 sm:order-none sm:col-span-2">
            <Link className={`tap ${linkClass}`} href={`/app/people/${person.id}/edit`}>
              Fix the address
            </Link>
          </p>
        ) : null}
        <div className="order-3 sm:order-none sm:col-span-2">
          <AddToGroup contactId={person.id} groups={groups} readOnly={readOnly} />
        </div>
      </div>
    </main>
  )
}
