'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { AddToGroup } from '@/app/app/people/[id]/add-to-group'
import { deleteContactAction, type ContactFormState } from '@/app/app/people/actions'
import { buttonClass, linkClass } from '@/app/app/people/ui'
import { formatUsPhone } from '@/config/phone'
import { VIEW_AS_READ_ONLY } from '@/auth/write-guard'
import type { ContactListRow } from '@/db/contacts'
import type { GroupListRow } from '@/db/groups'
import { REVIEW_WRONG_HOUSE } from '@/people/review-copy'
import { contactStatusLabel } from '@/people/status'
import { reviewQueueHref } from '@/people/url'

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

  return (
    <main className="px-4 py-10">
      <p>
        <Link className={linkClass} href="/app/people">
          Back to your people
        </Link>
      </p>
      <h1 className="mt-6 text-[22px] font-semibold">{person.name}</h1>
      <dl className="mt-6 flex max-w-xl flex-col gap-3 text-[15px]">
        <div>
          <dt className="font-medium">Email</dt>
          <dd>{person.email}</dd>
        </div>
        <div>
          <dt className="font-medium">Phone</dt>
          <dd>{phoneDisplay(person.phone)}</dd>
        </div>
        <div>
          <dt className="font-medium">Address</dt>
          <dd>
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
          </dd>
        </div>
        <div>
          <dt className="font-medium">Close date</dt>
          <dd>{person.closeDate ?? 'None on file'}</dd>
        </div>
        <div>
          <dt className="font-medium">Notes</dt>
          <dd>{person.notes ?? 'None on file'}</dd>
        </div>
        <div>
          <dt className="font-medium">Match</dt>
          <dd>{contactStatusLabel(person.status)}</dd>
        </div>
        <div>
          <dt className="font-medium">Calls</dt>
          <dd>
            {calledOn.length
              ? calledOn.map((day) => (
                  <span className="block" key={day}>
                    You called them on {day}.
                  </span>
                ))
              : 'None marked yet. Mark a call from your home page.'}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Groups</dt>
          <dd>{person.groupNames.length ? person.groupNames.join(', ') : 'None yet'}</dd>
        </div>
      </dl>
      {person.status === 'matched' ? (
        <div className="mt-6 max-w-xl text-[15px]">
          <p>
            On the record: {person.parcelAddress ?? 'the matched house'}
            {person.parcelApn ? ` · APN ${person.parcelApn}` : ''}
          </p>
          <p className="mt-2">
            <Link className={linkClass} href={reviewQueueHref(person.id, 'wrong-house')}>
              {REVIEW_WRONG_HOUSE}
            </Link>
          </p>
        </div>
      ) : null}
      {person.status === 'needs_review' ? (
        <p className="mt-6">
          <Link className={linkClass} href={`/app/people/${person.id}/review`}>
            Review this match
          </Link>
        </p>
      ) : null}
      {person.status === 'no_parcel' ? (
        <p className="mt-6">
          <Link className={linkClass} href={`/app/people/${person.id}/edit`}>
            Fix the address
          </Link>
        </p>
      ) : null}
      <p className="mt-8 flex flex-wrap gap-4">
        <Link className={buttonClass} href={`/app/people/${person.id}/edit`}>
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
          <button className={buttonClass} type="submit" disabled={readOnly}>
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
      <AddToGroup contactId={person.id} groups={groups} readOnly={readOnly} />
    </main>
  )
}
