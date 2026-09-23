import { and, eq, notInArray } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'
import { callListEntries } from '@/db/schema-call-lists'
import { loadCallListInput } from '@/jobs/call-list-input'
import { callListAsOf } from '@/jobs/call-list-period'
import type { JobHandler } from '@/jobs/types'
import { computeSignals } from '@/signals/compute'
import { periodOf } from '@/signals/period'

function readAsOf(value: unknown, fallback: Date) {
  if (value == null || value === '') return fallback
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) throw new Error('build_call_lists asOf is not a date')
  return parsed
}

export const buildCallLists: JobHandler = async (payload, ctx) => {
  const accountId = String(payload.accountId ?? '')
  if (!accountId) throw new Error('build_call_lists requires accountId')

  const { db } = getRuntimeDb()
  const [account] = await db
    .select({ timezone: accounts.timezone })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1)
  if (!account) throw new Error('Account not found')

  const asOf = callListAsOf(readAsOf(payload.asOf, ctx.now), account.timezone)
  const signals = computeSignals(await loadCallListInput(db, accountId, asOf))
  const period = periodOf(asOf)

  for (const signal of signals) {
    await db
      .insert(callListEntries)
      .values({
        accountId,
        contactId: signal.contactId,
        kind: signal.kind,
        detail: signal.detail,
        score: signal.score,
        period,
      })
      .onConflictDoUpdate({
        target: [callListEntries.accountId, callListEntries.contactId, callListEntries.period],
        set: { kind: signal.kind, detail: signal.detail, score: signal.score },
      })
  }

  const ids = signals.map((signal) => signal.contactId)
  const periodMatch = and(eq(callListEntries.accountId, accountId), eq(callListEntries.period, period))
  await db
    .delete(callListEntries)
    .where(ids.length ? and(periodMatch, notInArray(callListEntries.contactId, ids)) : periodMatch)
}
