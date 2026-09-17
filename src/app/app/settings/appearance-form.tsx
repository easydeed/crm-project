'use client'

import { useActionState } from 'react'
import { ACCENT_COLORS } from '@/config/settings'
import type { AccountRecord } from '@/db/accounts'
import { saveAppearanceAction, type AppearanceState } from '@/app/app/settings/actions'
import { FieldError, Muted, fieldClass } from '@/app/app/settings/field'
import { SaveButton } from '@/app/app/settings/save-button'

export function AppearanceForm({
  account,
  readOnly,
}: {
  account: AccountRecord
  readOnly?: boolean
}) {
  const [state, action, pending] = useActionState(
    saveAppearanceAction,
    {} as AppearanceState,
  )

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <h2 className="text-[18px] font-semibold">How the email looks</h2>
      <label className="text-[15px]">
        Sender name
        <input
          className={fieldClass}
          name="senderName"
          defaultValue={account.senderName ?? ''}
        />
      </label>
      <label className="text-[15px]">
        Reply-to email
        <input
          className={fieldClass}
          name="replyTo"
          type="email"
          defaultValue={account.replyTo ?? ''}
          aria-invalid={state.replyTo ? true : undefined}
        />
        <FieldError message={state.replyTo} />
      </label>
      <fieldset>
        <legend className="text-[15px]">Accent color</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {ACCENT_COLORS.map((color) => (
            <label key={color.value} className="text-[15px]">
              <input
                className="peer sr-only"
                type="radio"
                name="accentColor"
                value={color.value}
                defaultChecked={account.accentColor === color.value}
                aria-label={color.name}
              />
              <span
                className="block h-9 w-9 rounded-md peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-checked:outline peer-checked:outline-2 peer-checked:outline-offset-2 peer-checked:outline-foreground"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            </label>
          ))}
        </div>
        <FieldError message={state.accentColor} />
      </fieldset>
      {readOnly ? <Muted>Viewing as another agent is read only.</Muted> : null}
      <FieldError message={state.error} />
      <SaveButton pending={pending} savedAt={state.savedAt} readOnly={readOnly} />
    </form>
  )
}
