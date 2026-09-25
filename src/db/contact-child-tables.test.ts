import { readFileSync } from 'node:fs'
import { is } from 'drizzle-orm'
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core'
import { expect, test } from 'vitest'
import { CONTACT_CHILD_TABLES } from '@/db/live-contacts'
import * as schema from '@/db/schema'
import { schemaModuleFiles } from '@/db/find-schema-modules'

/** Tables whose foreign keys point at contacts, read from the schema itself. */
export function tablesReferencingContacts(modules: Record<string, unknown>[]): string[] {
  const tables = modules.flatMap((mod) => Object.values(mod)).filter((value): value is PgTable => is(value, PgTable))
  const names = tables
    .filter((table) => getTableConfig(table).foreignKeys.some((fk) => fk.reference().foreignTable === schema.contacts))
    .map((table) => getTableConfig(table).name)
  return [...new Set(names)].sort()
}

async function loadSchemaModules() {
  const files = schemaModuleFiles()
  const modules = await Promise.all(files.map((file) => import(`./${file.replace(/\.ts$/, '')}`)))
  return { files, modules: modules as Record<string, unknown>[] }
}

test('schema modules are discovered, not listed, and drizzle-kit reads every one', async () => {
  const { files } = await loadSchemaModules()
  expect(files).toContain('schema.ts')
  expect(files).toContain('schema-billing.ts')
  expect(files).not.toContain('schema.test.ts')
  const config = readFileSync(new URL('../../drizzle.config.ts', import.meta.url), 'utf8')
  const listed = [...config.matchAll(/'\.\/src\/db\/(schema[^']*\.ts)'/g)].map((m) => m[1]).sort()
  expect(listed).toEqual(files)
})

test('every table that references contacts has a stated live-join decision', async () => {
  const { modules } = await loadSchemaModules()
  const found = tablesReferencingContacts(modules)
  expect(found).toEqual(Object.keys(CONTACT_CHILD_TABLES).sort())
  for (const decision of Object.values(CONTACT_CHILD_TABLES)) {
    expect(decision).toMatch(/^(live|history|includes deleted): .{20,}/)
  }
})
