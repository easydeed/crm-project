import { desc, eq, inArray, sql } from 'drizzle-orm'
import { getAccountById } from '@/db/accounts'
import { loadDeliveryTotals } from '@/db/delivery-window'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, adminActions } from '@/db/schema'
import { EMAIL_HASH_SQL } from '@/suppression/hash'
import { ADMIN_UNPAUSE, COMPLAINT_PAUSE } from '@/db/system-pause'

export type SuppressionRow = {
  id: string
  email: string | null
  reason: string
  at: Date
}

export async function loadDeliverabilityForAdmin(adminAccountId: string, now = new Date()) {
  const admin = await getAccountById(adminAccountId)
  if (!admin || admin.role !== 'admin') return null
  const totals = await loadDeliveryTotals(now)
  const suppressed = await listSuppressions()
  const paused = await listSystemPaused()
  return { totals, suppressed, paused }
}

const REASON_LABEL: Record<string, string> = {
  unsubscribed: 'Unsubscribed',
  bounced: 'Hard bounce',
  complained: 'Spam complaint',
}

/**
 * Read from suppressions, which hold hashes only. An address shows when a contact
 * with that address still exists; otherwise it is not recoverable, by design.
 */
async function listSuppressions(): Promise<SuppressionRow[]> {
  const { db } = getRuntimeDb()
  const rows = await db.execute<{ id: string; reason: string; at: Date | string; email: string | null }>(sql.raw(`
    select s.id, s.reason::text as reason, s.created_at as at,
      (select c.email from contacts c where ${EMAIL_HASH_SQL('c.email')} = s.email_hash limit 1) as email
    from suppressions s
    order by s.created_at desc`))
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    reason: REASON_LABEL[row.reason] ?? row.reason,
    at: new Date(row.at),
  }))
}

async function listSystemPaused() {
  const { db } = getRuntimeDb()
  const paused = await db
    .select({ id: accounts.id, name: accounts.name })
    .from(accounts)
    .where(eq(accounts.paused, true))
  if (!paused.length) return []
  const actions = await db
    .select({
      targetAccountId: adminActions.targetAccountId,
      action: adminActions.action,
      createdAt: adminActions.createdAt,
    })
    .from(adminActions)
    .where(
      inArray(
        adminActions.targetAccountId,
        paused.map((row) => row.id),
      ),
    )
    .orderBy(desc(adminActions.createdAt))
  return paused.filter((account) => {
    const latest = actions.find(
      (action) =>
        action.targetAccountId === account.id &&
        (action.action === COMPLAINT_PAUSE || action.action === ADMIN_UNPAUSE),
    )
    return latest?.action === COMPLAINT_PAUSE
  })
}
