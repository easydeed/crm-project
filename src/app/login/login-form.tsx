'use client'

import { useActionState } from 'react'
import { loginAction, type LoginState } from '@/app/login/actions'
import { buttonClass, fieldClass } from '@/app/app/people/ui'

export function LoginForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState(loginAction, {} as LoginState)

  return (
    <form action={action} className="flex w-full flex-col gap-4.5 px-5 py-6">
      <input type="hidden" name="returnTo" value={returnTo} />
      {/* The label's words carry the weight; the input inherits font, so the label itself stays regular. */}
      <label className="text-[16px]">
        <span className="font-semibold">Email</span>
        <input
          className={fieldClass}
          type="email"
          name="email"
          autoComplete="email"
          required
        />
      </label>
      <label className="text-[16px]">
        <span className="font-semibold">Password</span>
        <input
          className={fieldClass}
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.error ? (
        <p className="text-[17px] text-foreground" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        className={buttonClass}
        type="submit"
        disabled={pending}
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
