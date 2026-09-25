'use client'

import type { AddonConfig, ConfigField } from '@/addons/types'
import { KEEPS_SETTINGS } from '@/app/app/addons/row-data'

const inputClass =
  'mt-1 w-full max-w-sm rounded-md border border-foreground/40 bg-background px-3 py-2 text-[15px] text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

function Field({ field, value, error, disabled }: { field: ConfigField; value: unknown; error?: string; disabled: boolean }) {
  const id = `addon-field-${field.name}`
  const described = error ? `${id}-error` : undefined
  let control
  if (field.kind === 'boolean') {
    control = <input aria-describedby={described} defaultChecked={value === true} disabled={disabled} id={id} name={field.name} type="checkbox" className="h-5 w-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" />
  } else if (field.kind === 'enum') {
    control = (
      <select aria-describedby={described} className={inputClass} defaultValue={value === undefined ? '' : String(value)} disabled={disabled} id={id} name={field.name}>
        <option value="">Choose one</option>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
  } else {
    control = (
      <input
        aria-describedby={described}
        className={inputClass}
        defaultValue={value === undefined ? '' : String(value)}
        disabled={disabled}
        id={id}
        inputMode={field.kind === 'number' ? 'numeric' : undefined}
        name={field.name}
        type="text"
      />
    )
  }
  return (
    <div>
      <label className="block text-[15px]" htmlFor={id}>
        {field.label}
        {field.optional ? ' (optional)' : ''}
      </label>
      {control}
      {error ? (
        <p className="mt-1 text-[15px]" id={described} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** The settings a config-gated add-on needs before its switch can latch. */
export function AddonConfigForm({
  fields,
  config,
  errors,
  pending,
  onSubmit,
}: {
  fields: ConfigField[]
  config: AddonConfig
  errors: Record<string, string>
  pending: boolean
  onSubmit: (values: Record<string, unknown>) => void
}) {
  return (
    <form
      className="mt-4 flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const values: Record<string, unknown> = {}
        for (const field of fields) values[field.name] = field.kind === 'boolean' ? data.get(field.name) === 'on' : data.get(field.name)
        onSubmit(values)
      }}
    >
      {fields.map((field) => (
        <Field key={field.name} disabled={pending} error={errors[field.name]} field={field} value={config[field.name]} />
      ))}
      <p className="text-[15px] text-foreground/80">{KEEPS_SETTINGS}</p>
      <button
        className="self-start rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        disabled={pending}
        type="submit"
      >
        {pending ? 'Saving…' : 'Save and switch on'}
      </button>
    </form>
  )
}
