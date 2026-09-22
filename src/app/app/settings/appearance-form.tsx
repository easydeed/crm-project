'use client'

import { useActionState, useState } from 'react'
import { ACCENT_COLORS } from '@/config/settings'
import type { AccountRecord } from '@/db/accounts'
import { AppearancePreview } from '@/app/app/settings/appearance-preview'
import { saveAppearanceAction, type AppearanceState } from '@/app/app/settings/actions'
import { FieldError, Muted, fieldClass } from '@/app/app/settings/field'
import { SaveButton } from '@/app/app/settings/save-button'
import { accentFrom, senderFrom } from '@/digest/apply-look'
import type { SettingsPreviewPayload } from '@/digest/preview-types'

export function AppearanceForm({
  account,
  readOnly,
  preview,
}: {
  account: AccountRecord
  readOnly?: boolean
  preview: SettingsPreviewPayload
}) {
  const [state, action, pending] = useActionState(
    saveAppearanceAction,
    {} as AppearanceState,
  )
  const [senderName, setSenderName] = useState(account.senderName ?? '')
  const [accent, setAccent] = useState(account.accentColor)

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <form action={action} className="flex max-w-xl flex-col gap-4">
        <h2 className="text-[18px] font-semibold">How the email looks</h2>
        <label className="text-[15px]">
          Sender name
          <input
            className={fieldClass}
            name="senderName"
            value={senderName}
            onChange={(event) => setSenderName(event.target.value)}
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
                  checked={accent === color.value}
                  onChange={() => setAccent(color.value)}
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
      <AppearancePreview
        result={preview.result}
        sample={preview.sample}
        saved={{
          sender: senderFrom(account),
          accent: accentFrom(account.accentColor),
        }}
        live={{
          sender: senderName.trim() || account.name,
          accent: accentFrom(accent),
        }}
      />
    </div>
  )
}
