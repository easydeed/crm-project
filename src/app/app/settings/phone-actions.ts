'use server'

import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { assertWritable } from '@/auth/write-guard'
import { confirmPhoneCode, requestPhoneCode, type VerifyResult } from '@/text/verification'

async function writableAccountId(): Promise<{ ok: true; accountId: string } | { ok: false; result: VerifyResult }> {
  const session = await readRequestSession()
  if (!session) return { ok: false, result: { ok: false, message: 'Sign in again to verify your phone.' } }
  const gate = assertWritable(session)
  if (!gate.ok) return { ok: false, result: { ok: false, message: gate.error } }
  return { ok: true, accountId: effectiveAccountId(session) }
}

export async function requestCodeAction(): Promise<VerifyResult> {
  const gate = await writableAccountId()
  if (!gate.ok) return gate.result
  return requestPhoneCode(gate.accountId)
}

export async function confirmCodeAction(code: string): Promise<VerifyResult> {
  const gate = await writableAccountId()
  if (!gate.ok) return gate.result
  return confirmPhoneCode(gate.accountId, code)
}
