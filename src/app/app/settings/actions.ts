'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { readRequestSession } from '@/auth/current-session'
import { saveAppearance, saveDetails, saveSending } from '@/app/app/settings/save'
import type { AppearanceState, DetailsState, SendingState } from '@/app/app/settings/types'

export type { AppearanceState, DetailsState, SendingState }

async function requireSession() {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/settings')
  return session
}

export async function saveDetailsAction(
  _prev: DetailsState,
  formData: FormData,
): Promise<DetailsState> {
  const result = await saveDetails(await requireSession(), formData)
  if (result.savedAt || result.detailsPersisted) revalidatePath('/app/settings')
  return result
}

export async function saveAppearanceAction(
  _prev: AppearanceState,
  formData: FormData,
): Promise<AppearanceState> {
  return saveAppearance(await requireSession(), formData)
}

export async function saveSendingAction(
  _prev: SendingState,
  formData: FormData,
): Promise<SendingState> {
  return saveSending(await requireSession(), formData)
}
