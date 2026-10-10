'use client'

import { useActionState } from 'react'
import { SEND_DAYS, SEND_TIMES, TIMEZONES } from '@/config/settings'
import type { AccountRecord } from '@/db/accounts'
import { saveSendingAction, type SendingState } from '@/app/app/settings/actions'
import { FieldError, Muted, fieldClass } from '@/app/app/settings/field'
import { SaveButton } from '@/app/app/settings/save-button'
import { panelBodyClass, panelClass, panelHeaderClass } from '@/app/app/people/ui'

export function SendingForm({
  account,
  readOnly,
  systemPaused = false,
}: {
  account: AccountRecord
  readOnly?: boolean
  systemPaused?: boolean
}) {
  const [state, action, pending] = useActionState(saveSendingAction, {} as SendingState)

  return (
    <section aria-labelledby="sending-heading" className={panelClass}>
      <h2 className={panelHeaderClass} id="sending-heading">
        Sending
      </h2>
    <form action={action} className={`grid gap-4 sm:grid-cols-3 ${panelBodyClass}`}>
      <label className="text-[15px]">
        Send day
        <select
          className={fieldClass}
          name="sendDay"
          defaultValue={account.sendDay === 15 ? '15' : '1'}
          aria-invalid={state.sendDay ? true : undefined}
        >
          {SEND_DAYS.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
        <FieldError message={state.sendDay} />
      </label>
      <label className="text-[15px]">
        Time of day
        <select
          className={fieldClass}
          name="sendTime"
          defaultValue={account.sendTime ?? '09:00'}
          aria-invalid={state.sendTime ? true : undefined}
        >
          {SEND_TIMES.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
        <FieldError message={state.sendTime} />
      </label>
      <label className="text-[15px]">
        Timezone
        <select
          className={fieldClass}
          name="timezone"
          defaultValue={account.timezone ?? 'America/Los_Angeles'}
          aria-invalid={state.timezone ? true : undefined}
        >
          {TIMEZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
        <FieldError message={state.timezone} />
      </label>
      <div className="sm:col-span-3">
        <label className="flex min-h-11 items-center gap-3 text-[15px]">
          <input
            className="size-5.5 accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            type="checkbox"
            name="paused"
            defaultChecked={account.paused || systemPaused}
            disabled={systemPaused || readOnly}
          />
          Pause my monthly note
        </label>
        <Muted>
          {systemPaused
            ? 'We paused your monthly note. Contact us to turn it back on.'
            : 'Nothing sends while this is on. Turn it back on any time.'}
        </Muted>
      </div>
      <div className="flex flex-col gap-4 sm:col-span-3">
        {readOnly ? <Muted>Viewing as another agent is read only.</Muted> : null}
        <FieldError message={state.error} />
        <SaveButton pending={pending} savedAt={state.savedAt} readOnly={readOnly} />
      </div>
    </form>
    </section>
  )
}
