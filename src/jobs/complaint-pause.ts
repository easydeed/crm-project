import { eq } from 'drizzle-orm'
import { shouldPause } from '@/admin/delivery-math'
import { loadDeliveryTotals } from '@/db/delivery-window'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, adminActions } from '@/db/schema'
import { COMPLAINT_PAUSE, systemPauseState } from '@/db/system-pause'

export async function maybePauseForComplaints(accountId: string, now = new Date()) {
  const totals = await loadDeliveryTotals(now, accountId)
  if (!shouldPause(totals.delivered, totals.complained)) return false
  if (await systemPauseState(accountId)) return false
  const { db } = getRuntimeDb()
  await db.update(accounts).set({ paused: true }).where(eq(accounts.id, accountId))
  await db.insert(adminActions).values({
    targetAccountId: accountId,
    action: COMPLAINT_PAUSE,
    detail: {
      actor: 'system',
      reason: `Complaint rate exceeded 0.1% (${totals.complained} of ${totals.delivered} delivered).`,
      complained: totals.complained,
      delivered: totals.delivered,
    },
  })
  return true
}
