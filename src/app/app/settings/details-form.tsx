'use client'

import { useActionState } from 'react'
import { formatUsPhone } from '@/config/phone'
import type { AccountRecord } from '@/db/accounts'
import { saveDetailsAction, type DetailsState } from '@/app/app/settings/actions'
import { FieldError, Muted, fieldClass } from '@/app/app/settings/field'
import { SaveButton } from '@/app/app/settings/save-button'

export function DetailsForm({
  account,
  readOnly,
}: {
  account: AccountRecord
  readOnly?: boolean
}) {
  const [state, action, pending] = useActionState(saveDetailsAction, {} as DetailsState)

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <h2 className="text-[18px] font-semibold">Your details</h2>
      <label className="text-[15px]">
        Full name
        <input
          className={fieldClass}
          name="name"
          autoComplete="name"
          required
          defaultValue={account.name}
          aria-invalid={state.name ? true : undefined}
        />
        <FieldError message={state.name} />
      </label>
      <div>
        <p className="text-[15px]">Email</p>
        <p className={`${fieldClass} border-transparent px-0`}>{account.email}</p>
        <Muted>Contact us to change your email.</Muted>
      </div>
      <label className="text-[15px]">
        Brokerage
        <input
          className={fieldClass}
          name="brokerage"
          autoComplete="organization"
          defaultValue={account.brokerage ?? ''}
        />
      </label>
      <label className="text-[15px]">
        DRE number
        <input
          className={fieldClass}
          name="dre"
          defaultValue={account.dre ?? ''}
          aria-invalid={state.dre ? true : undefined}
        />
        <FieldError message={state.dre} />
      </label>
      <label className="text-[15px]">
        Phone
        <input
          className={fieldClass}
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={account.phone ? formatUsPhone(account.phone) : ''}
          aria-invalid={state.phone ? true : undefined}
        />
        <FieldError message={state.phone} />
      </label>
      {readOnly ? <Muted>Viewing as another agent is read only.</Muted> : null}
      <FieldError message={state.error} />
      <SaveButton pending={pending} savedAt={state.savedAt} readOnly={readOnly} />
    </form>
  )
}
