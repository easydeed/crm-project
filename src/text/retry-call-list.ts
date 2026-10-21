import type { JobHandler } from '@/jobs/types'
import { textCallList } from '@/text/call-list-text'

/** Retry only the text, never rewrite the call list or repeat accepted messages. */
export const retryCallListText: JobHandler = async (payload, ctx) => {
  const accountId = String(payload.accountId ?? '')
  const period = String(payload.period ?? '')
  const asOf = new Date(String(payload.asOf ?? ''))
  if (!accountId || !/^\d{4}-\d{2}$/.test(period) || !Number.isFinite(asOf.getTime())) throw new Error('Invalid text retry payload')
  const outcome = await textCallList(accountId, period, asOf, ctx.now)
  if (outcome === 'retryable') throw new Error('Call-list text was refused temporarily; retry later')
}
