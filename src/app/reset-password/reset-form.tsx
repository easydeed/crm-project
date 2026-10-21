'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { resetPasswordAction } from '@/app/reset-password/actions'
import { PASSWORD_MIN_LENGTH } from '@/auth/password-rules'
import { buttonClass, fieldClass, linkClass, inlineLinkClass } from '@/app/app/people/ui'

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, { ok: false, message: '' })
  if (state.ok) return <p className="mt-4 text-[17px]">Password changed. <Link className={`tap ${inlineLinkClass}`} href="/login">Sign in</Link></p>
  return <form action={action} className="mt-4 flex flex-col gap-4">
    <input type="hidden" name="token" value={token} />
    <label className="text-[17px]">New password<input className={fieldClass} name="password" type="password" autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} required /></label>
    <p className="text-[15px]">At least {PASSWORD_MIN_LENGTH} characters.</p>
    {state.message ? <p role="alert" className="text-[17px]">{state.message}</p> : null}
    <button type="submit" disabled={pending} className={buttonClass}>{pending ? 'Saving…' : 'Save password'}</button>
    <Link href="/forgot-password" className={`tap ${linkClass}`}>Request a new link</Link>
  </form>
}
