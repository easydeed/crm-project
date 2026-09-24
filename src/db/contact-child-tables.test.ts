import { is } from 'drizzle-orm'
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core'
import { expect, test } from 'vitest'
import { CONTACT_CHILD_TABLES } from '@/db/live-contacts'
import * as schema from '@/db/schema'
import * as callLists from '@/db/schema-call-lists'
import * as suppressionsSchema from '@/db/schema-suppressions'

/** Tables whose foreign keys point at contacts, read from the schema itself. */
export function tablesReferencingContacts(modules: Record<string, unknown>[]): string[] {
  const tables = modules.flatMap((mod) => Object.values(mod)).filter((value): value is PgTable => is(value, PgTable))
  const names = tables
    .filter((table) => getTableConfig(table).foreignKeys.some((fk) => fk.reference().foreignTable === schema.contacts))
    .map((table) => getTableConfig(table).name)
  return [...new Set(names)].sort()
}

test('every table that references contacts has a stated live-join decision', () => {
  const found = tablesReferencingContacts([schema, callLists, suppressionsSchema])
  expect(found).toEqual(Object.keys(CONTACT_CHILD_TABLES).sort())
  for (const decision of Object.values(CONTACT_CHILD_TABLES)) {
    expect(decision).toMatch(/^(live|history|includes deleted): .{20,}/)
  }
})
