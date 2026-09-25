'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { registerAccount } from '@/auth/register-account'
import { startCheckout } from '@/billing/account-billing'
import {
  SESSION_COOKIE,
  createSessionValue,
  sessionCookieOptions,
} from '@/auth/session'

export type RegisterState = {
  email?: string
  password?: string
}

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const result = await registerAccount({
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    brokerage: String(formData.get('brokerage') ?? ''),
    dre: String(formData.get('dre') ?? ''),
    phone: String(formData.get('phone') ?? ''),
  })

  if (!result.ok) {
    return { [result.field]: result.message }
  }

  const jar = await cookies()
  jar.set(
    SESSION_COOKIE,
    createSessionValue(result.accountId, 'agent'),
    sessionCookieOptions(),
  )
  // Straight to Stripe Checkout. If it can't open, the dashboard says the plan isn't active and links to billing.
  let next = '/app'
  try {
    next = await startCheckout(result.accountId)
  } catch (err) {
    console.error('[billing] checkout at signup failed', err)
  }
  redirect(next)
}
