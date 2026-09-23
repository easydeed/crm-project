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
    attempts: integer('attempts').notNull().default(0),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    error: text('error'),
  },
  (t) => [
    uniqueIndex('jobs_kind_payload_key_run_after_uidx').on(
      t.kind,
      t.payloadKey,
      t.runAfter,
    ),
  ],
)
