'use server'

import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import {
  SESSION_COOKIE,
  createSessionValue,
  sessionCookieOptions,
} from '@/auth/session'
import { recordViewAs } from '@/db/admin-accounts'
import { cookies } from 'next/headers'

export async function viewAsAction(formData: FormData) {
  const session = await readRequestSession()
  if (!session || session.role !== 'admin') redirect('/login?returnTo=/admin')
  const targetAccountId = String(formData.get('accountId') ?? '')
  const recorded = await recordViewAs(session.accountId, targetAccountId)
  if (!recorded) redirect('/admin/accounts')
  const jar = await cookies()
  jar.set(
    SESSION_COOKIE,
    createSessionValue(session.accountId, session.role, targetAccountId),
    sessionCookieOptions(),
  )
  redirect('/app')
}

export async function exitViewAsAction() {
  const session = await readRequestSession()
  if (!session || session.role !== 'admin') redirect('/login?returnTo=/admin')
  const jar = await cookies()
  jar.set(
    SESSION_COOKIE,
    createSessionValue(session.accountId, session.role),
    sessionCookieOptions(),
  )
  redirect('/admin/accounts')
}
