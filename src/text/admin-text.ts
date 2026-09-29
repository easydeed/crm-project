import { and, eq } from 'drizzle-orm'
import { getAccountById } from '@/db/accounts'
import { getRuntimeDb } from '@/db/runtime'
import { textMessages } from '@/db/schema-text'
import { callListPeriod } from '@/jobs/call-list-period'

export type PeriodTextRow = { providerId: string | null; error: string | null; permanentFailure: boolean; toPhone: string; createdAt: Date }

/**
 * What support needs to answer "did my text go out?". A claimed row is never retried within its
 * period (the unique claim is what stops a double send), so a failure here is final for the month.
 */
export function describePeriodText(row: PeriodTextRow | null): { state: string; detail: string | null } {
  if (!row) return { state: 'No text this period', detail: null }
  if (row.providerId) return { state: 'Sent', detail: `Provider id ${row.providerId}` }
  if (row.error) {
    return { state: row.permanentFailure ? 'Not sent (permanent)' : 'Not sent (not retried this period)', detail: row.error }
  }
  return { state: 'Claimed, not sent', detail: 'The send stopped before it finished. It is not retried this period.' }
}

/** This period's call-list text for an account, in the account's own timezone, as the job computes it. */
export async function loadPeriodText(accountId: string, now = new Date()) {
  const account = await getAccountById(accountId)
  const period = callListPeriod(now, account?.timezone ?? null)
  const { db } = getRuntimeDb()
  const [row] = await db
    .select({
      providerId: textMessages.providerId,
      error: textMessages.error,
      permanentFailure: textMessages.permanentFailure,
      toPhone: textMessages.toPhone,
      createdAt: textMessages.createdAt,
    })
    .from(textMessages)
    .where(and(eq(textMessages.accountId, accountId), eq(textMessages.kind, 'call_list'), eq(textMessages.period, period)))
    .limit(1)
  return { period, row: row ?? null }
}
