import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    kind: text('kind').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    payloadKey: text('payload_key').notNull(),
    runAfter: timestamp('run_after', { withTimezone: true }).notNull(),
    enqueuedFor: timestamp('enqueued_for', { withTimezone: true }).notNull().defaultNow(),
    attempts: integer('attempts').notNull().default(0),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    error: text('error'),
  },
  (t) => [
    // The scheduled identity never changes when backoff moves run_after.
    // Retries move run_after on this same row. A fresh enqueue for the same
    // kind and payload still collides. Inserting a new row for a retry would
    // miss this index and could send the same note twice.
    uniqueIndex('jobs_kind_payload_key_enqueued_for_uidx').on(
      t.kind,
      t.payloadKey,
      t.enqueuedFor,
    ),
  ],
)
