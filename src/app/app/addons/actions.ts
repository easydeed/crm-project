'use server'

import { revalidatePath } from 'next/cache'
import { switchAddonOff, switchAddonOn, type SwitchResult } from '@/addons/state'
import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { assertWritable } from '@/auth/write-guard'

async function writableAccountId(): Promise<{ ok: true; accountId: string } | { ok: false; result: SwitchResult }> {
  const session = await readRequestSession()
  if (!session) return { ok: false, result: { ok: false, reason: 'forbidden', message: 'Sign in again to change add-ons.' } }
  const gate = assertWritable(session)
  if (!gate.ok) return { ok: false, result: { ok: false, reason: 'forbidden', message: gate.error } }
  return { ok: true, accountId: effectiveAccountId(session) }
}

/** Switch on. `submitted` is the config form's values, or null to use what was stored. */
export async function enableAddonAction(key: string, submitted: Record<string, unknown> | null): Promise<SwitchResult> {
  const gate = await writableAccountId()
  if (!gate.ok) return gate.result
  const result = await switchAddonOn(gate.accountId, key, submitted)
  if (result.ok) revalidatePath('/app/addons')
  return result
}

export async function disableAddonAction(key: string): Promise<SwitchResult> {
  const gate = await writableAccountId()
  if (!gate.ok) return gate.result
  const result = await switchAddonOff(gate.accountId, key)
  if (result.ok) revalidatePath('/app/addons')
  return result
}
