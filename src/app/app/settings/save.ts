import { parseOptionalDre, parseOptionalReplyTo, parseRequiredName } from '@/config/account-fields'
import { parseOptionalUsPhone } from '@/config/phone'
import { isAccentColor, isSendDay, isSendTime, isTimezone } from '@/config/settings'
import type { SessionPayload } from '@/auth/session'
import { assertWritable } from '@/auth/write-guard'
import {
  updateAccountAppearance,
  updateAccountDetails,
  updateAccountSending,
} from '@/db/account-settings'
import type { AppearanceState, DetailsState, SendingState } from '@/app/app/settings/types'

export async function saveDetails(session: SessionPayload, formData: FormData): Promise<DetailsState> {
  const gate = assertWritable(session)
  if (!gate.ok) return { error: gate.error }

  const name = parseRequiredName(String(formData.get('name') ?? ''))
  const dre = parseOptionalDre(String(formData.get('dre') ?? ''))
  const phone = parseOptionalUsPhone(String(formData.get('phone') ?? ''))
  const errors: DetailsState = {}
  if (!name.ok) errors.name = name.message
  if (!dre.ok) errors.dre = dre.message
  if (!phone.ok) errors.phone = phone.message
  if (!name.ok || !dre.ok || !phone.ok) return errors

  await updateAccountDetails(session.accountId, {
    name: name.name,
    brokerage: String(formData.get('brokerage') ?? '').trim() || null,
    dre: dre.dre,
    phone: phone.phone,
  })
  return { savedAt: Date.now() }
}

export async function saveAppearance(
  session: SessionPayload,
  formData: FormData,
): Promise<AppearanceState> {
  const gate = assertWritable(session)
  if (!gate.ok) return { error: gate.error }

  const replyTo = parseOptionalReplyTo(String(formData.get('replyTo') ?? ''))
  const accentRaw = String(formData.get('accentColor') ?? '').trim()
  const errors: AppearanceState = {}
  if (!replyTo.ok) errors.replyTo = replyTo.message
  if (accentRaw && !isAccentColor(accentRaw)) {
    errors.accentColor = 'Pick one of the five accent colors.'
  }
  if (!replyTo.ok || errors.accentColor) return errors

  await updateAccountAppearance(session.accountId, {
    senderName: String(formData.get('senderName') ?? '').trim() || null,
    replyTo: replyTo.replyTo,
    accentColor: accentRaw || null,
  })
  return { savedAt: Date.now() }
}

export async function saveSending(session: SessionPayload, formData: FormData): Promise<SendingState> {
  const gate = assertWritable(session)
  if (!gate.ok) return { error: gate.error }

  const sendDay = Number(formData.get('sendDay'))
  const sendTime = String(formData.get('sendTime') ?? '')
  const timezone = String(formData.get('timezone') ?? '')
  const errors: SendingState = {}
  if (!isSendDay(sendDay)) errors.sendDay = 'Send day must be the 1st or the 15th.'
  if (!isSendTime(sendTime)) errors.sendTime = 'Pick a send time from the list.'
  if (!isTimezone(timezone)) errors.timezone = 'Pick a timezone from the list.'
  if (errors.sendDay || errors.sendTime || errors.timezone) return errors

  await updateAccountSending(session.accountId, {
    sendDay,
    sendTime,
    timezone,
    paused: formData.get('paused') === 'on',
  })
  return { savedAt: Date.now() }
}
