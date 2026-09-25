'use server'

import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { assertWritable } from '@/auth/write-guard'
import { setCancelAtPeriodEnd, startCheckout } from '@/billing/account-billing'

const BILLING = '/app/settings/billing'

async function writableAccountId() {
  const session = await readRequestSession()
  if (!session) redirect(`/login?returnTo=${BILLING}`)
  if (!assertWritable(session).ok) redirect(BILLING)
  return effectiveAccountId(session)
}

export async function startCheckoutAction() {
  const accountId = await writableAccountId()
  let url = `${BILLING}?error=checkout`
  try {
    url = await startCheckout(accountId)
  } catch (err) {
    console.error('[billing] checkout failed', err)
  }
  redirect(url)
}

export async function cancelPlanAction() {
  const accountId = await writableAccountId()
  let to = `${BILLING}?done=canceled`
  try {
    await setCancelAtPeriodEnd(accountId, true)
  } catch (err) {
    console.error('[billing] cancel failed', err)
    to = `${BILLING}?error=cancel`
  }
  redirect(to)
}

export async function resumePlanAction() {
  const accountId = await writableAccountId()
  let to = `${BILLING}?done=resumed`
  try {
    await setCancelAtPeriodEnd(accountId, false)
  } catch (err) {
    console.error('[billing] resume failed', err)
    to = `${BILLING}?error=resume`
  }
  redirect(to)
}
