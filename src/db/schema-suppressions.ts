import { sql } from 'drizzle-orm'
import { check, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const suppressionReasonEnum = pgEnum('suppression_reason', ['unsubscribed', 'bounced', 'complained'])

/** 'all' covers bounces and complaints, which stop every stream to that address. */
export const suppressionScopeEnum = pgEnum('suppression_scope', ['monthly', 'weekly', 'all'])

/**
 * Someone asked not to be contacted. Keyed by sha256 of the lowercased, trimmed address,
 * never the address itself, so this can't become a mailing list. Rows are never removed.
 */
export const suppressions = pgTable(
  'suppressions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    emailHash: text('email_hash').notNull(),
    reason: suppressionReasonEnum('reason').notNull(),
    scope: suppressionScopeEnum('scope').notNull(),
    source: text('source').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('suppressions_email_hash_scope_uidx').on(t.emailHash, t.scope),
    check('suppressions_email_hash_is_sha256', sql`${t.emailHash} ~ '^[0-9a-f]{64}$'`),
  ],
)

/**
 * A homeowner undid their own unsubscribe ("Actually, keep them coming"). The lifted
 * suppression is copied here before it is deleted, so its history survives.
 * Bounces and complaints are never lifted and never appear here.
 */
export const suppressionLifts = pgTable(
  'suppression_lifts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    emailHash: text('email_hash').notNull(),
    reason: suppressionReasonEnum('reason').notNull(),
    scope: suppressionScopeEnum('scope').notNull(),
    originalSource: text('original_source').notNull(),
    suppressedAt: timestamp('suppressed_at', { withTimezone: true }).notNull(),
    source: text('source').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check('suppression_lifts_email_hash_is_sha256', sql`${t.emailHash} ~ '^[0-9a-f]{64}$'`)],
)
