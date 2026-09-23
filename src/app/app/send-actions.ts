'use server'

import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { assertWritable } from '@/auth/write-guard'
import {
  resumeUpcomingSend,
  skipUpcomingSend,
  unpauseAccount,
} from '@/jobs/send-controls'

async function writableAccountId() {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app')
  const gate = assertWritable(session)
  if (!gate.ok) redirect('/app')
  return effectiveAccountId(session)
}

export async function skipMonthAction() {
  const accountId = await writableAccountId()
  await skipUpcomingSend(accountId)
  redirect('/app')
}

export async function resumeMonthAction() {
  const accountId = await writableAccountId()
  await resumeUpcomingSend(accountId)
  redirect('/app')
}

export async function unpauseAction() {
  const accountId = await writableAccountId()
  await unpauseAccount(accountId)
  redirect('/app')
}
