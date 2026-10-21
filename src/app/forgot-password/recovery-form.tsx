'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { requestRecoveryAction } from '@/app/forgot-password/actions'
import { buttonClass, fieldClass, linkClass } from '@/app/app/people/ui'

export function RecoveryForm() {
  const [state, action, pending] = useActionState(requestRecoveryAction, { submitted: false, link: null as string | null })
  return <form action={action} className="mt-4 flex flex-col gap-4">
    <p className="text-[17px]">Local demo: the reset link appears here instead of being emailed.</p>
    <label className="text-[17px]">Email<input name="email" type="email" autoComplete="email" required className={fieldClass} /></label>
    <button type="submit" disabled={pending} className={buttonClass}>{pending ? 'Checking…' : 'Request reset link'}</button>
    {state.submitted ? <p role="status" className="text-[17px]">If this local demo account exists, its reset link is available below.</p> : null}
    {state.link ? <Link className={`tap ${linkClass}`} href={state.link}>Open demo reset link</Link> : null}
  </form>
}
