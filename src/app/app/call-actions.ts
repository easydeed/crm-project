'use server'

import { readRequestSession } from '@/auth/current-session'
import { effectiveAccountId } from '@/auth/effective-account'
import { assertWritable } from '@/auth/write-guard'
import { logCall, undoCall, type CallLogResult, type CallOutcome } from '@/db/call-log'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function writableAccountId(): Promise<{ ok: true; accountId: string } | { ok: false; error: string }> {
  const session = await readRequestSession()
  if (!session) return { ok: false, error: 'Sign in again to save this.' }
  const gate = assertWritable(session)
  if (!gate.ok) return gate
  return { ok: true, accountId: effectiveAccountId(session) }
}

export async function logCallAction(contactId: string, outcome: CallOutcome): Promise<CallLogResult> {
  if (!UUID.test(contactId)) return { ok: false, error: 'Unknown person.' }
  if (outcome !== 'called' && outcome !== 'dismissed') return { ok: false, error: 'Unknown action.' }
  const gate = await writableAccountId()
  if (!gate.ok) return gate
  return logCall(gate.accountId, contactId, outcome)
}

export async function undoCallAction(contactId: string): Promise<CallLogResult> {
  if (!UUID.test(contactId)) return { ok: false, error: 'Unknown person.' }
  const gate = await writableAccountId()
  if (!gate.ok) return gate
  return undoCall(gate.accountId, contactId)
}
