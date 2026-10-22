import { desc, eq } from 'drizzle-orm'
import { loadStopRecovery } from '@/text/stop-state'
import { isAddonEnabled } from '@/addons/state'
import { TEXT_CALL_LIST_KEY } from '@/addons/text-call-list'
import { getRuntimeDb } from '@/db/runtime'
import { textMessages } from '@/db/schema-text'

export type TextNotice = 'billing_pending' | 'billing_failed' | 'stopped' | 'unreachable' | null

/** Why the call-list text went off, if texting stopped it. Gone once the agent verifies again or switches it back on. */
export async function loadTextNotice(accountId: string): Promise<TextNotice> {
  const { db } = getRuntimeDb()
  const recovery = await loadStopRecovery(accountId)
  if (recovery) return recovery === 'failed' ? 'billing_failed' : 'billing_pending'
  if (await isAddonEnabled(accountId, TEXT_CALL_LIST_KEY)) return null
  const [latest] = await db
    .select({ kind: textMessages.kind, permanentFailure: textMessages.permanentFailure })
    .from(textMessages)
    .where(eq(textMessages.accountId, accountId))
    .orderBy(desc(textMessages.createdAt))
    .limit(1)
  if (latest?.kind === 'stop_received') return 'stopped'
  if (latest?.kind === 'call_list' && latest.permanentFailure) return 'unreachable'
  return null
}
