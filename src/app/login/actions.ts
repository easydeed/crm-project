'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { authenticate } from '@/auth/authenticate'
import {
  SESSION_COOKIE,
  createSessionValue,
  safeReturnTo,
  sessionCookieOptions,
} from '@/auth/session'

export type LoginState = {
  error?: string
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const result = await authenticate(
    String(formData.get('email') ?? ''),
    String(formData.get('password') ?? ''),
  )

  if (!result.ok) {
    return { error: "That email and password don't match." }
  }

  const jar = await cookies()
  jar.set(
    SESSION_COOKIE,
    createSessionValue(result.accountId, result.role),
    sessionCookieOptions(),
  )
  redirect(safeReturnTo(String(formData.get('returnTo') ?? '')))
}

export async function logoutAction() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  redirect('/login')
}
