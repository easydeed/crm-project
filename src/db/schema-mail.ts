import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

function createdAt() {
  return timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}

/** Raw provider webhook bodies. Kept for admin. Rows are not deleted. */
export const mailEvents = pgTable('mail_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  kind: text('kind').notNull(),
  email: text('email'),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
})
