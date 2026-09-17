'use client'

import { useActionState } from 'react'
import { SEND_DAYS, SEND_TIMES, TIMEZONES } from '@/config/settings'
import type { AccountRecord } from '@/db/accounts'
import { saveSendingAction, type SendingState } from '@/app/app/settings/actions'
import { FieldError, Muted, fieldClass } from '@/app/app/settings/field'
import { SaveButton } from '@/app/app/settings/save-button'

export function SendingForm({
  account,
  readOnly,
}: {
  account: AccountRecord
  readOnly?: boolean
}) {
  const [state, action, pending] = useActionState(saveSendingAction, {} as SendingState)

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4">
      <h2 className="text-[18px] font-semibold">Sending</h2>
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
      <div>
        <label className="flex items-center gap-2 text-[15px]">
          <input
            className="h-4 w-4 accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            type="checkbox"
            name="paused"
            defaultChecked={account.paused}
          />
          Pause my monthly note
        </label>
        <Muted>Nothing sends while this is on. Turn it back on any time.</Muted>
      </div>
      {readOnly ? <Muted>Viewing as another agent is read only.</Muted> : null}
      <FieldError message={state.error} />
      <SaveButton pending={pending} savedAt={state.savedAt} readOnly={readOnly} />
    </form>
  )
}
