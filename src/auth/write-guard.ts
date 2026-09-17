import type { SessionPayload } from '@/auth/session'

export const VIEW_AS_READ_ONLY = 'Viewing as another agent is read only.'

export function assertWritable(session: SessionPayload): { ok: true } | { ok: false; error: string } {
  if (session.viewingAsAccountId) return { ok: false, error: VIEW_AS_READ_ONLY }
  return { ok: true }
}
