'use client'

import { useState, useTransition } from 'react'
import { confirmCodeAction, requestCodeAction } from '@/app/app/settings/phone-actions'
import { formatUsPhone } from '@/config/phone'

const buttonClass =
  'rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'
const inputClass =
  'mt-1 w-40 rounded-md border border-foreground/40 bg-background px-3 py-2 text-[15px] tracking-widest text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

/** Proves the phone in Settings is the agent's own before anything is texted to it. */
export function PhoneVerification({ phone, verified, readOnly }: { phone: string | null; verified: boolean; readOnly: boolean }) {
  const [sent, setSent] = useState(false)
  const [done, setDone] = useState(verified)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  let body
  if (!phone) body = <p className="mt-2 text-[15px]">Add your phone above to verify it for texts.</p>
  else if (done) body = <p className="mt-2 text-[15px]">{formatUsPhone(phone)} is verified for texts.</p>
  else {
    body = (
      <div className="mt-2 flex flex-col gap-3 text-[15px]">
        <p>We text a six-digit code to {formatUsPhone(phone)} to make sure it is yours.</p>
        {readOnly ? null : (
          <button
            className={`${buttonClass} self-start`}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await requestCodeAction()
                setSent(result.ok)
                setMessage(result.ok ? 'Code sent. It expires in 10 minutes.' : result.message)
              })
            }
            type="button"
          >
            {sent ? 'Send a new code' : 'Text me a code'}
          </button>
        )}
        {sent && !readOnly ? (
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              const code = String(new FormData(event.currentTarget).get('code') ?? '')
              startTransition(async () => {
                const result = await confirmCodeAction(code)
                setDone(result.ok)
                setMessage(result.ok ? null : result.message)
              })
            }}
          >
            <label className="text-[15px]" htmlFor="phone-code">
              Code
              <input autoComplete="one-time-code" className={`${inputClass} block`} id="phone-code" inputMode="numeric" maxLength={6} name="code" />
            </label>
            <button className={buttonClass} disabled={pending} type="submit">
              Confirm
            </button>
          </form>
        ) : null}
      </div>
    )
  }

  return (
    <section id="phone">
      <h2 className="text-[17px] font-semibold">Phone for texts</h2>
      {body}
      {message ? (
        <p className="mt-2 text-[15px]" role="status">
          {message}
        </p>
      ) : null}
    </section>
  )
}
