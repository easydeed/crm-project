import type { SessionPayload } from '@/auth/session'

export function effectiveAccountId(session: SessionPayload) {
  return session.viewingAsAccountId ?? session.accountId
}
