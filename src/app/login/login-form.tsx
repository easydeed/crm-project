'use client'

import { useActionState } from 'react'
import { loginAction, type LoginState } from '@/app/login/actions'

const fieldClass =
  'mt-1 w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-[15px] text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

export function LoginForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState(loginAction, {} as LoginState)

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="text-[15px]">
        Email
        <input
          className={fieldClass}
          type="email"
          name="email"
          autoComplete="email"
          required
        />
      </label>
      <label className="text-[15px]">
        Password
        <input
          className={fieldClass}
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.error ? (
        <p className="text-[15px] text-foreground" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        className="rounded-md bg-foreground px-4 py-2 text-[15px] text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
