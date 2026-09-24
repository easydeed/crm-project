import { and, inArray } from 'drizzle-orm'
import type { createDb } from '@/db/client'
import { suppressions } from '@/db/schema-suppressions'
import { emailHash } from '@/suppression/hash'

type Db = Pick<ReturnType<typeof createDb>['db'], 'select' | 'insert'>
export type SuppressionReason = (typeof suppressions.$inferSelect)['reason']
export type SuppressionScope = 'monthly' | 'weekly'
export type SuppressionSource = 'unsubscribe_page' | 'one_click' | 'postmark_webhook'

/** Plain reason shown wherever a suppressed person is skipped or imported. */
export const SUPPRESSED_REASON = 'They asked not to hear from us.'

/** Record an opt-out. Never removed; a second opt-out for the same address and scope is a no-op. */
export async function suppress(
  db: Db,
  email: string,
  reason: SuppressionReason,
  scope: SuppressionScope | 'all',
  source: SuppressionSource,
  now = new Date(),
) {
  if (!email.trim()) return
  await db
    .insert(suppressions)
    .values({ emailHash: emailHash(email), reason, scope, source, createdAt: now })
    .onConflictDoNothing({ target: [suppressions.emailHash, suppressions.scope] })
}

/** Hashes of the given addresses that must not receive this scope. Check with emailHash(address). */
export async function suppressedHashes(db: Db, emails: string[], scope: SuppressionScope) {
  const hashes = [...new Set(emails.filter((email) => email.trim()).map(emailHash))]
  if (!hashes.length) return new Set<string>()
  const rows = await db
    .select({ emailHash: suppressions.emailHash })
    .from(suppressions)
    .where(and(inArray(suppressions.emailHash, hashes), inArray(suppressions.scope, [scope, 'all'])))
  return new Set(rows.map((row) => row.emailHash))
}

export async function isSuppressed(db: Db, email: string, scope: SuppressionScope) {
  return (await suppressedHashes(db, [email], scope)).has(emailHash(email))
}
