'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { registerAccount } from '@/auth/register-account'
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
  redirect('/app')
}
