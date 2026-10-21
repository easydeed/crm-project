import { jobs } from '@/db/schema'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { isAddonEnabled } from '@/addons/state'
import { TEXT_CALL_LIST_KEY } from '@/addons/text-call-list'
import { getRuntimeDb } from '@/db/runtime'
import { textMessages } from '@/db/schema-text'

export type TextNotice = 'billing_pending' | 'stopped' | 'unreachable' | null

/** Why the call-list text went off, if texting stopped it. Gone once the agent verifies again or switches it back on. */
export async function loadTextNotice(accountId: string): Promise<TextNotice> {
  const { db } = getRuntimeDb()
  const [pending] = await db.select({ id: jobs.id }).from(jobs).where(and(eq(jobs.kind, 'stop_texting'), isNull(jobs.completedAt), sql`${jobs.payload}->>'accountId' = ${accountId}`)).limit(1)
  if (pending) return 'billing_pending'
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
