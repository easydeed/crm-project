import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { accounts, contacts } from './schema'

export const callListEntries = pgTable(
  'call_list_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id),
    kind: text('kind').notNull(),
    detail: text('detail').notNull(),
    score: integer('score').notNull(),
    period: text('period').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('call_list_entries_account_contact_period_uidx').on(
      t.accountId,
      t.contactId,
      t.period,
    ),
  ],
)
