'use server'

import { redirect } from 'next/navigation'
import { parseOptionalDre, parseOptionalReplyTo, parseRequiredName } from '@/config/account-fields'
import { parseOptionalUsPhone } from '@/config/phone'
import { isAccentColor, isSendDay, isSendTime, isTimezone } from '@/config/settings'
import { readRequestSession } from '@/auth/current-session'
import {
  updateAccountAppearance,
  updateAccountDetails,
  updateAccountSending,
} from '@/db/account-settings'

export type DetailsState = {
  savedAt?: number
  name?: string
  dre?: string
  phone?: string
}

export type AppearanceState = {
  savedAt?: number
  replyTo?: string
  accentColor?: string
}

export type SendingState = {
  savedAt?: number
  sendDay?: string
  sendTime?: string
  timezone?: string
}

async function requireAccountId() {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/settings')
  return session.accountId
}

export async function saveDetailsAction(
  _prev: DetailsState,
  formData: FormData,
): Promise<DetailsState> {
  const accountId = await requireAccountId()
  const name = parseRequiredName(String(formData.get('name') ?? ''))
  const dre = parseOptionalDre(String(formData.get('dre') ?? ''))
  const phone = parseOptionalUsPhone(String(formData.get('phone') ?? ''))
  const errors: DetailsState = {}
  if (!name.ok) errors.name = name.message
  if (!dre.ok) errors.dre = dre.message
  if (!phone.ok) errors.phone = phone.message
  if (!name.ok || !dre.ok || !phone.ok) return errors

  await updateAccountDetails(accountId, {
    name: name.name,
    brokerage: String(formData.get('brokerage') ?? '').trim() || null,
    dre: dre.dre,
    phone: phone.phone,
  })
  return { savedAt: Date.now() }
}

export async function saveAppearanceAction(
  _prev: AppearanceState,
  formData: FormData,
): Promise<AppearanceState> {
  const accountId = await requireAccountId()
  const replyTo = parseOptionalReplyTo(String(formData.get('replyTo') ?? ''))
  const accentRaw = String(formData.get('accentColor') ?? '').trim()
  const errors: AppearanceState = {}
  if (!replyTo.ok) errors.replyTo = replyTo.message
  if (accentRaw && !isAccentColor(accentRaw)) {
    errors.accentColor = 'Pick one of the five accent colors.'
  }
  if (!replyTo.ok || errors.accentColor) return errors

  await updateAccountAppearance(accountId, {
    senderName: String(formData.get('senderName') ?? '').trim() || null,
    replyTo: replyTo.replyTo,
    accentColor: accentRaw || null,
  })
  return { savedAt: Date.now() }
}

export async function saveSendingAction(
  _prev: SendingState,
  formData: FormData,
): Promise<SendingState> {
  const accountId = await requireAccountId()
  const sendDay = Number(formData.get('sendDay'))
  const sendTime = String(formData.get('sendTime') ?? '')
  const timezone = String(formData.get('timezone') ?? '')
  const errors: SendingState = {}
  if (!isSendDay(sendDay)) errors.sendDay = 'Send day must be the 1st or the 15th.'
  if (!isSendTime(sendTime)) errors.sendTime = 'Pick a send time from the list.'
  if (!isTimezone(timezone)) errors.timezone = 'Pick a timezone from the list.'
  if (errors.sendDay || errors.sendTime || errors.timezone) return errors

  await updateAccountSending(accountId, {
    sendDay,
    sendTime,
    timezone,
    paused: formData.get('paused') === 'on',
  })
  return { savedAt: Date.now() }
}
