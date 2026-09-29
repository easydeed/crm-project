import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { ClosedListing } from '@/providers/types'
import { accounts } from './schema'

/**
 * The last closings search per account, so the import reads it instead of paying the MLS a
 * second time. Fresh for 15 minutes; rows older than an hour are deleted whenever a new one is
 * written. The import still checks the posted selection against these rows, never trusts it.
 */
export const closingSearches = pgTable('closing_searches', {
  accountId: uuid('account_id')
    .primaryKey()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').notNull(),
  listings: jsonb('listings').$type<ClosedListing[]>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
