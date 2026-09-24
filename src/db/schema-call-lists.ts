import { integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { accounts, contacts } from './schema'

export const callListEntries = pgTable(
  'call_list_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
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

export const callOutcomeEnum = pgEnum('call_outcome', ['called', 'dismissed'])

/** What the agent did with a call list name. One outcome per person per month. */
export const callLog = pgTable(
  'call_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    period: text('period').notNull(),
    outcome: callOutcomeEnum('outcome').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('call_log_account_contact_period_uidx').on(t.accountId, t.contactId, t.period)],
)

export const contactNotes = pgTable('contact_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
})
