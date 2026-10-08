'use client'

import { panelBodyClass, panelClass, panelHeaderClass } from '@/app/app/people/ui'
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
    // The preview is its own panel under the form (OR-046), fed by this form's live state. Beside
    // the form, as drawn, it would be ~304px wide and its Desktop/Phone toggle would change nothing.
    <>
      <section aria-labelledby="look-heading" className={panelClass}>
      <h2 className={panelHeaderClass} id="look-heading">
        How the email looks
      </h2>
      <form action={action} className={`grid gap-4 sm:grid-cols-2 ${panelBodyClass}`}>
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
        <fieldset className="sm:col-span-2">
          <legend className="text-[15px]">Accent color</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {ACCENT_COLORS.map((color) => (
              <label key={color.value} className="block text-[15px]">
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
                  className="block size-11 rounded-md peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-checked:outline peer-checked:outline-2 peer-checked:outline-offset-2 peer-checked:outline-foreground"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              </label>
            ))}
          </div>
          <FieldError message={state.accentColor} />
        </fieldset>
        <div className="flex flex-col gap-4 sm:col-span-2">
          {readOnly ? <Muted>Viewing as another agent is read only.</Muted> : null}
          <FieldError message={state.error} />
          <SaveButton pending={pending} savedAt={state.savedAt} readOnly={readOnly} />
        </div>
      </form>
      </section>
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
    </>
  )
}
