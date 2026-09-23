import { and, desc, eq, gt } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'
import { callListEntries, callLog } from '@/db/schema-call-lists'
import { callListPeriod } from '@/jobs/call-list-period'

export type CallOutcome = (typeof callLog.$inferSelect)['outcome']
export type CallLogResult = { ok: true } | { ok: false; error: string }

/** The UI offers undo for five seconds; the server allows a little slack for the round trip. */
export const UNDO_WINDOW_MS = 10_000

async function currentPeriod(accountId: string, now: Date) {
  const { db } = getRuntimeDb()
  const [account] = await db
    .select({ timezone: accounts.timezone })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1)
  return callListPeriod(now, account?.timezone ?? null)
}

export async function logCall(
  accountId: string,
  contactId: string,
  outcome: CallOutcome,
  now = new Date(),
): Promise<CallLogResult> {
  const { db } = getRuntimeDb()
  const period = await currentPeriod(accountId, now)
  const [entry] = await db
    .select({ kind: callListEntries.kind })
    .from(callListEntries)
    .where(
      and(
        eq(callListEntries.accountId, accountId),
        eq(callListEntries.contactId, contactId),
        eq(callListEntries.period, period),
      ),
    )
    .limit(1)
  if (!entry) return { ok: false, error: 'This name is not on this month’s list anymore.' }
  await db
    .insert(callLog)
    .values({ accountId, contactId, kind: entry.kind, period, outcome, createdAt: now })
    .onConflictDoNothing({ target: [callLog.accountId, callLog.contactId, callLog.period] })
  return { ok: true }
}

export async function undoCall(accountId: string, contactId: string, now = new Date()): Promise<CallLogResult> {
  const { db } = getRuntimeDb()
  const period = await currentPeriod(accountId, now)
  const deleted = await db
    .delete(callLog)
    .where(
      and(
        eq(callLog.accountId, accountId),
        eq(callLog.contactId, contactId),
        eq(callLog.period, period),
        gt(callLog.createdAt, new Date(now.getTime() - UNDO_WINDOW_MS)),
      ),
    )
    .returning({ id: callLog.id })
  return deleted.length ? { ok: true } : { ok: false, error: 'Too late to undo. It’s saved.' }
}

/** Dates the agent marked this person as called, newest first. */
export async function listCalledDates(accountId: string, contactId: string) {
  const { db } = getRuntimeDb()
  const rows = await db
    .select({ at: callLog.createdAt })
    .from(callLog)
    .where(
      and(eq(callLog.accountId, accountId), eq(callLog.contactId, contactId), eq(callLog.outcome, 'called')),
    )
    .orderBy(desc(callLog.createdAt))
  return rows.map((row) => row.at)
}
