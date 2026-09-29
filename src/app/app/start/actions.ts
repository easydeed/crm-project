'use server'

import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { assertWritable } from '@/auth/write-guard'
import type { ImportSummary } from '@/import/types'
import type { ClosedListing } from '@/providers/types'
import { importClosings, searchClosings } from '@/signup/closings'

export type SearchState =
  | { kind: 'idle' }
  | { kind: 'malformed'; message: string; value: string }
  | { kind: 'found'; agentId: string; listings: ClosedListing[] }
  | { kind: 'error'; message: string }

export type ImportClosingsState = { error?: string; result?: ImportSummary }

const MLS_UNREACHABLE = "We couldn't reach your MLS just now. Try again, or upload a list below."

async function session() {
  const current = await readRequestSession()
  if (!current) redirect('/login?returnTo=/app/start')
  return current
}

export async function searchClosingsAction(_prev: SearchState, formData: FormData): Promise<SearchState> {
  const current = await session()
  const gate = assertWritable(current)
  if (!gate.ok) return { kind: 'error', message: gate.error }
  const value = String(formData.get('agentId') ?? '')
  try {
    const result = await searchClosings(current.accountId, value)
    return result.kind === 'malformed' ? { ...result, value } : result
  } catch (err) {
    console.error('[signup] closings search failed', err)
    return { kind: 'error', message: MLS_UNREACHABLE }
  }
}

export async function importClosingsAction(
  _prev: ImportClosingsState,
  formData: FormData,
): Promise<ImportClosingsState> {
  const current = await session()
  const gate = assertWritable(current)
  if (!gate.ok) return { error: gate.error }
  const agentId = String(formData.get('agentId') ?? '')
  const selected = formData.getAll('mlsId').map(String)
  try {
    const result = await importClosings(current.accountId, agentId, selected)
    return 'error' in result ? { error: result.error } : { result }
  } catch (err) {
    console.error('[signup] closings import failed', err)
    return { error: MLS_UNREACHABLE }
  }
}
