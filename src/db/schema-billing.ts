import { sql } from 'drizzle-orm'
import { boolean, check, index, integer, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { accounts } from './schema'

/** A cache of the account's Stripe subscription. Stripe is the source of truth; only the webhook writes here. */
export const subscriptions = pgTable('subscriptions', {
  accountId: uuid('account_id')
    .primaryKey()
    .references(() => accounts.id, { onDelete: 'no action' }),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubId: text('stripe_sub_id').unique(),
  plan: text('plan').notNull(),
  status: text('status').notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
})

/**
 * Raw Stripe webhook bodies, keyed by Stripe's event id. The primary key is the
 * idempotency guard: a replayed event cannot insert a second row, so it changes nothing.
 */
export const stripeEvents = pgTable('stripe_events', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * One row per call to a billable data provider, with its cost at the rate in force.
 * cost_cents is null while that rate is not set. Cost history outlives the account.
 */
export const providerCalls = pgTable(
  'provider_calls',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    provider: text('provider').notNull(),
    operation: text('operation').notNull(),
    count: integer('count').notNull().default(1),
    /** Fractional: an email or an API call can cost less than a cent. */
    costCents: numeric('cost_cents', { precision: 12, scale: 4, mode: 'number' }),
    accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('provider_calls_created_at_idx').on(t.createdAt),
    check('provider_calls_count_positive', sql`${t.count} > 0`),
    check('provider_calls_cost_not_negative', sql`${t.costCents} is null or ${t.costCents} >= 0`),
  ],
)
