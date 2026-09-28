import { sql } from 'drizzle-orm'
import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { accounts } from './schema'

export const textKindEnum = pgEnum('text_kind', ['call_list', 'verify', 'stop_received'])

/** The one open code per account. The phone is the number the code was sent to. */
export const phoneVerifications = pgTable('phone_verifications', {
  accountId: uuid('account_id')
    .primaryKey()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  phone: text('phone').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Every text to an agent's own phone, and every STOP they send back. A call-list text is
 * claimed here before it is sent: Twilio has no idempotency key, so the unique index on
 * (account, period) is the only thing between a job re-run and a second text.
 */
export const textMessages = pgTable(
  'text_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    kind: textKindEnum('kind').notNull(),
    period: text('period'),
    toPhone: text('to_phone').notNull(),
    providerId: text('provider_id'),
    error: text('error'),
    permanentFailure: boolean('permanent_failure').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('text_messages_call_list_account_period_uidx').on(t.accountId, t.period).where(sql`${t.kind} = 'call_list'`),
    index('text_messages_account_created_idx').on(t.accountId, t.createdAt),
    index('text_messages_provider_id_idx').on(t.providerId),
  ],
)
