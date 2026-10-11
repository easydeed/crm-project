'use client'

import { useActionState } from 'react'
import { registerAction, type RegisterState } from '@/app/register/actions'
import { buttonClass, fieldClass, mutedClass } from '@/app/app/people/ui'
import { PASSWORD_REQUIREMENTS } from '@/auth/password-rules'
import { PLAN_LINE } from '@/app/app/settings/billing/billing-copy'

function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  required,
  error,
}: {
  label: string
  name: string
  type?: string
  autoComplete?: string
  required?: boolean
  error?: string
}) {
  return (
    <label className="text-[16px]">
      <span className="font-semibold">{label}</span>
      <input
        className={fieldClass}
        type={type}
        name={name}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error ? true : undefined}
      />
      {error ? (
        <span className="mt-1 block text-[17px]" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, {} as RegisterState)

  return (
    <form action={action} className="flex w-full flex-col gap-4.5 px-5 py-6">
      <Field label="Name" name="name" autoComplete="name" required />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.email}
      />
      <div>
        {/* OR-047: a real label, so the input's name is "Password"; the rule is its description. */}
        <label className="block text-[16px] font-semibold" htmlFor="register-password">
          Password
        </label>
        <ul className={`mt-1 ${mutedClass}`} id="register-password-rules">
          {PASSWORD_REQUIREMENTS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <input
          aria-describedby="register-password-rules"
          className={fieldClass}
          id="register-password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          aria-invalid={state.password ? true : undefined}
        />
        {state.password ? (
          <p className="mt-1 text-[17px]" role="alert">
            {state.password}
          </p>
        ) : null}
      </div>
      <hr className="border-rule" />
      <Field label="Brokerage" name="brokerage" autoComplete="organization" />
      <Field label="DRE number" name="dre" />
      <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
      <button
        className={buttonClass}
        type="submit"
        disabled={pending}
      >
        {pending ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-[17px]">
        Next you add a card in Stripe: {PLAN_LINE}. Cancel any time from Settings.
      </p>
    </form>
  )
}
