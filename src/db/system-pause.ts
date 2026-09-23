import { and, desc, eq, inArray } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, adminActions } from '@/db/schema'

export const COMPLAINT_PAUSE = 'complaint_pause'
export const ADMIN_UNPAUSE = 'admin_unpause'

export async function systemPauseState(accountId: string) {
  const { db } = getRuntimeDb()
  const [account] = await db
    .select({ paused: accounts.paused })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1)
  if (!account?.paused) return false
  const [latest] = await db
    .select({ action: adminActions.action })
    .from(adminActions)
    .where(
      and(
        eq(adminActions.targetAccountId, accountId),
        inArray(adminActions.action, [COMPLAINT_PAUSE, ADMIN_UNPAUSE]),
      ),
    )
    .orderBy(desc(adminActions.createdAt))
    .limit(1)
  return latest?.action === COMPLAINT_PAUSE
}
