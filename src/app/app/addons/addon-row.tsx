'use client'

import { useState, useTransition } from 'react'
import { disableAddonAction, enableAddonAction } from '@/app/app/addons/actions'
import { AddonConfigForm } from '@/app/app/addons/addon-config-form'
import { AddonSwitch } from '@/app/app/addons/addon-switch'
import { priceLabel, type AddonRowData } from '@/app/app/addons/row-data'
import type { SwitchResult } from '@/addons/state'

const SAVE_FIRST = 'Fill in the settings below to switch this on.'

/**
 * One add-on. Title, blurb, and price render the same on or off; only the switch changes.
 * A config-gated add-on opens its form instead of latching, and latches only when the
 * server accepts the config.
 */
export function AddonRow({
  row,
  enabled,
  readOnly,
  onChange,
}: {
  row: AddonRowData
  enabled: boolean
  readOnly: boolean
  onChange: (enabled: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [config, setConfig] = useState(row.config)
  const [pending, startTransition] = useTransition()

  function settle(result: SwitchResult, next: boolean, submitted?: Record<string, unknown>) {
    if (result.ok) {
      setOpen(false)
      setMessage(null)
      setErrors({})
      if (submitted) setConfig(submitted as typeof config)
      onChange(next)
      return
    }
    setMessage(result.message)
    setErrors(result.fieldErrors ?? {})
    if (result.reason === 'config') setOpen(true)
  }

  function toggle() {
    if (enabled) {
      startTransition(async () => settle(await disableAddonAction(row.key), false))
      return
    }
    if (row.requiresConfig && (open || Object.keys(config).length === 0)) {
      setOpen(true)
      setMessage(SAVE_FIRST)
      return
    }
    startTransition(async () => settle(await enableAddonAction(row.key, null), true))
  }

  function submit(values: Record<string, unknown>) {
    startTransition(async () => settle(await enableAddonAction(row.key, values), true, values))
  }

  return (
    <li className="border-b border-foreground/20 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h3 className="text-[17px] font-semibold">{row.title}</h3>
          <p className="mt-1 text-[15px]">{row.blurb}</p>
          <p className="mt-1 text-[15px]">{priceLabel(row)}</p>
        </div>
        <AddonSwitch checked={enabled} disabled={readOnly || pending} label={row.title} onToggle={toggle} />
      </div>
      {message ? (
        <p className="mt-3 text-[15px]" role="status">
          {message}
        </p>
      ) : null}
      {open && !enabled && !readOnly ? (
        <AddonConfigForm config={config} errors={errors} fields={row.fields} onSubmit={submit} pending={pending} />
      ) : null}
    </li>
  )
}
