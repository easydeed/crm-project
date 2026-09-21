'use client'

import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveContactAction, type ContactFormState } from '@/app/app/people/actions'
import { buttonClass, fieldClass, linkClass } from '@/app/app/people/ui'
import { formatUsPhone } from '@/config/phone'
import { VIEW_AS_READ_ONLY } from '@/auth/write-guard'
import type { ContactListRow } from '@/db/contacts'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 text-[15px]" role="alert">
      {message}
    </p>
  )
}

function phoneValue(phone: string | null) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10 ? formatUsPhone(digits) : phone
}

export function PersonForm({
  person,
  readOnly,
}: {
  person: ContactListRow
  readOnly?: boolean
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(saveContactAction, {} as ContactFormState)

  useEffect(() => {
    if (state.savedAt) router.refresh()
  }, [state.savedAt, router])

  return (
    <form action={action} className="mt-6 flex max-w-xl flex-col gap-4">
      <input type="hidden" name="contactId" value={person.id} />
      <label className="text-[15px]">
        Name
        <input
          className={fieldClass}
          name="name"
          required
          defaultValue={person.name}
          aria-invalid={state.name ? true : undefined}
        />
        <FieldError message={state.name} />
      </label>
      <label className="text-[15px]">
        Email
        <input
          className={fieldClass}
          name="email"
          type="email"
          required
          defaultValue={person.email}
          aria-invalid={state.email ? true : undefined}
        />
        <FieldError message={state.email} />
      </label>
      <label className="text-[15px]">
        Phone
        <input
          className={fieldClass}
          name="phone"
          type="tel"
          defaultValue={phoneValue(person.phone)}
          aria-invalid={state.phone ? true : undefined}
        />
        <FieldError message={state.phone} />
      </label>
      <label className="text-[15px]">
        Address
        <input
          className={fieldClass}
          name="address"
          required
          defaultValue={person.addressRaw}
          aria-invalid={state.address ? true : undefined}
        />
        <FieldError message={state.address} />
      </label>
      <label className="text-[15px]">
        Close date
        <input
          className={fieldClass}
          name="closeDate"
          type="date"
          defaultValue={person.closeDate ?? ''}
          aria-invalid={state.closeDate ? true : undefined}
        />
        <FieldError message={state.closeDate} />
      </label>
      <label className="text-[15px]">
        Notes
        <textarea
          className={`${fieldClass} min-h-28`}
          name="notes"
          defaultValue={person.notes ?? ''}
        />
      </label>
      {readOnly ? <p className="text-[15px]">{VIEW_AS_READ_ONLY}</p> : null}
      <FieldError message={state.error} />
      {state.savedAt ? (
        <p className="text-[15px]" aria-live="polite">
          {state.rematched ? 'Saved. We re-checked the address.' : 'Saved.'}
        </p>
      ) : null}
      <button className={buttonClass} type="submit" disabled={pending || readOnly}>
        {pending ? 'Saving…' : 'Save'}
      </button>
      <Link className={linkClass} href={`/app/people/${person.id}`}>
        Back to {person.name}
      </Link>
    </form>
  )
}
