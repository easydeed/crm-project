import { desc, eq, inArray, sql } from 'drizzle-orm'
import { getAccountById } from '@/db/accounts'
import { loadDeliveryTotals } from '@/db/delivery-window'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, adminActions } from '@/db/schema'
import { liveContacts } from '@/db/live-contacts'
import { suppressions } from '@/db/schema-suppressions'
import { EMAIL_HASH_SQL, emailHash } from '@/suppression/hash'
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
 * Read from suppressions, which hold hashes only. An address shows when a live contact
 * with that address exists; otherwise it is not recoverable, by design.
 */
async function listSuppressions(): Promise<SuppressionRow[]> {
  const { db } = getRuntimeDb()
  const rows = await db
    .select({ id: suppressions.id, emailHash: suppressions.emailHash, reason: suppressions.reason, at: suppressions.createdAt })
    .from(suppressions)
    .orderBy(desc(suppressions.createdAt))
  const hashes = [...new Set(rows.map((row) => row.emailHash))]
  const liveEmails = hashes.length
    ? await db
        .select({ email: liveContacts.email })
        .from(liveContacts)
        .where(inArray(sql.raw(EMAIL_HASH_SQL('"live_contacts"."email"')), hashes))
    : []
  const byHash = new Map(liveEmails.map((row) => [emailHash(row.email), row.email]))
  return rows.map((row) => ({
    id: row.id,
    email: byHash.get(row.emailHash) ?? null,
    reason: REASON_LABEL[row.reason] ?? row.reason,
    at: row.at,
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
