import { and, eq, gte, sql } from 'drizzle-orm'
import { loadBillingState } from '@/billing/load-state'
import { billingAllowsSending } from '@/billing/status'
import { getRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'
import { textMessages } from '@/db/schema-text'
import { switchAddonOff } from '@/addons/state'
import { TEXT_CALL_LIST_KEY } from '@/addons/text-call-list'

export type Db = ReturnType<typeof getRuntimeDb>['db']

export async function billingActive(db: Db, accountId: string, now: Date) {
  return billingAllowsSending(await loadBillingState(db, accountId), now)
}

export async function codesSentSince(db: Db, accountId: string, since: Date) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(textMessages)
    .where(and(eq(textMessages.accountId, accountId), eq(textMessages.kind, 'verify'), gte(textMessages.createdAt, since)))
  return row?.count ?? 0
}

/**
 * The agent's phone will not take our texts (they replied STOP, or the number is dead).
 * Verification is cleared, the add-on goes off, and a row explains it on the dashboard.
 */
export async function stopTexting(db: Db, accountId: string, toPhone: string, kind: 'stop_received' | 'call_list', now: Date) {
  await db.update(accounts).set({ phoneVerifiedAt: null }).where(eq(accounts.id, accountId))
  await switchAddonOff(accountId, TEXT_CALL_LIST_KEY)
  if (kind === 'stop_received') await db.insert(textMessages).values({ accountId, kind, toPhone, createdAt: now })
}
