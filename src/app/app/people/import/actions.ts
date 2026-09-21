'use server'

import { redirect } from 'next/navigation'
import { readRequestSession } from '@/auth/current-session'
import { runImport } from '@/import/run-import'
import type { ImportState } from '@/import/types'

export type { ImportState }

export async function importContactsAction(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const session = await readRequestSession()
  if (!session) redirect('/login?returnTo=/app/people/import')
  return runImport(session, formData)
}
