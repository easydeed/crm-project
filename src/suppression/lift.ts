import { and, eq } from 'drizzle-orm'
import type { createDb } from '@/db/client'
import { suppressionLifts, suppressions } from '@/db/schema-suppressions'
import { emailHash } from '@/suppression/hash'
import type { SuppressionScope } from '@/suppression/suppressions'

type Db = ReturnType<typeof createDb>['db']
type Stop = { reason: string; scope: string; source: string }

/** Only a homeowner's own unsubscribe can be undone. A bounce or complaint comes from the mailbox provider. */
const SELF_SOURCES = ['unsubscribe_page', 'one_click']

export function stopsState(stops: Stop[], scope: SuppressionScope) {
  const blocked = stops.some((stop) => stop.reason === 'bounced' || stop.reason === 'complained')
  const forScope = stops.filter((stop) => stop.scope === scope || stop.scope === 'all')
  const reversible =
    !blocked &&
    forScope.length > 0 &&
    stops.every((stop) => stop.reason === 'unsubscribed' && SELF_SOURCES.includes(stop.source))
  return { blocked, suppressed: forScope.length > 0, reversible }
}

export async function addressStops(db: Pick<Db, 'select'>, email: string): Promise<Stop[]> {
  return db
    .select({ reason: suppressions.reason, scope: suppressions.scope, source: suppressions.source })
    .from(suppressions)
    .where(eq(suppressions.emailHash, emailHash(email)))
}

/**
 * "Actually, keep them coming." Re-checks inside one transaction, copies each lifted row
 * to suppression_lifts, then deletes it. Returns false, changing nothing, if anything
 * about the address is not a self-made unsubscribe.
 */
export async function liftSelfUnsubscribe(db: Db, email: string, scope: SuppressionScope, now = new Date()) {
  const hash = emailHash(email)
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(suppressions).where(eq(suppressions.emailHash, hash)).for('update')
    if (!stopsState(rows, scope).reversible) return false
    const lifted = rows.filter((row) => row.scope === scope)
    for (const row of lifted) {
      await tx.insert(suppressionLifts).values({
        emailHash: hash,
        reason: row.reason,
        scope: row.scope,
        originalSource: row.source,
        suppressedAt: row.createdAt,
        source: 'keep_them_coming',
        createdAt: now,
      })
      await tx.delete(suppressions).where(and(eq(suppressions.id, row.id), eq(suppressions.emailHash, hash)))
    }
    return lifted.length > 0
  })
}
