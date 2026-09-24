import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { INCLUDE_DELETED_READERS } from '@/db/live-contacts'

/**
 * Every read of contacts declares which kind it is. src/db/live-contacts.ts is the only door;
 * INCLUDE_DELETED_READERS is the boundary. Test files are fixtures and are not scanned.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const HELPER = 'src/db/live-contacts.ts'
const SCHEMA = /^src\/db\/schema[\w-]*\.ts$/
const NAMESPACE_SCHEMA_OK = ['src/db/client.ts', 'src/matching/candidates.ts']

function sourceFilesAll(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return sourceFilesAll(full)
    return /\.(ts|tsx|mjs)$/.test(name) ? [full] : []
  })
}

function sourceFiles(dir: string): string[] {
  return sourceFilesAll(dir).filter((file) => /\.(ts|tsx)$/.test(file) && !/\.test\.ts$/.test(file))
}

/** Every way a file could reach the contacts table other than the one it is allowed. */
export function contactAccessViolations(file: string, src: string): string[] {
  if (file === HELPER || SCHEMA.test(file)) return []
  const found: string[] = []
  const allowedDeleted = file in INCLUDE_DELETED_READERS
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    const names = m[1]!
    if (/schema$/.test(m[2]!) && /\bcontacts\b/.test(names)) found.push('imports contacts from the schema')
    if (m[2] === '@/db/live-contacts' && /\b(contactsTable|contactsIncludingDeleted|liveContacts)\s+as\b/.test(names)) {
      found.push('renames a contacts export on import')
    }
  }
  if (/import\s*\*\s*as\s+\w+\s+from\s*['"][^'"]*schema['"]/.test(src) && !NAMESPACE_SCHEMA_OK.includes(file)) {
    found.push('namespace-imports the schema')
  }
  if (/import\s*\*\s*as\s+\w+\s+from\s*['"]@\/db\/live-contacts['"]/.test(src)) found.push('namespace-imports live-contacts')
  if (/export\s+[^;]*from\s*['"]@\/db\/live-contacts['"]/.test(src)) found.push('re-exports live-contacts')
  if (/\bschema\.contacts\b|\.query\.contacts\b/.test(src)) found.push('reaches contacts through the schema object')
  // Any drizzle column leads back to its table; so does a subquery's internals. Nothing in src needs either.
  if (/\.table\b/.test(src)) found.push('reaches a table through a column (.table)')
  if (/\._\.|\bselectedFields\b/.test(src)) found.push("reaches into drizzle internals (._ / selectedFields)")
  if (/\bcontactsIncludingDeleted\b/.test(src) && !allowedDeleted) found.push('reads deleted contacts without being allowlisted')
  // contactsTable is a write target only: update/insert/delete(contactsTable) or contactsTable.<column>.
  for (const m of src.matchAll(/contactsTable/g)) {
    const before = src.slice(Math.max(0, m.index! - 8), m.index!)
    const after = src.slice(m.index! + 'contactsTable'.length, m.index! + 'contactsTable'.length + 40)
    const importLine = /import\s*\{[^}]*$/.test(src.slice(Math.max(0, m.index! - 200), m.index!))
    const write = /\.(update|insert|delete)\($/.test(before) && after.startsWith(')')
    const column = /^\.\w+/.test(after) && !/^\.\w+\.table\b/.test(after)
    if (!importLine && !write && !column) found.push(`uses contactsTable outside a write: ...${before}contactsTable${after.slice(0, 12)}`)
  }
  if (/\b(from|join)\s+("?public"?\.)?"?contacts"?(?![\w-])/i.test(src.replace(/^\s*(import|export)\b[^;]*?from\s*['"][^'"]*['"]/gm, ''))) {
    found.push('reads contacts in raw SQL')
  }
  return found
}

/**
 * Tests and scripts read contacts directly on purpose: fixtures must see raw rows to prove a
 * delete. What they must never do is hand src a door, so they are scanned for that alone.
 */
export function contactDoorExports(src: string): string[] {
  const found: string[] = []
  const names = String.raw`\b(contacts|contactsTable|contactsIncludingDeleted)\b`
  if (new RegExp(String.raw`export\s*\{[^}]*` + names + String.raw`[^}]*\}`).test(src)) found.push('exports a contacts binding')
  if (new RegExp(String.raw`export\s+(const|let|var)\s+\w+\s*=\s*[^;\n]*` + names).test(src)) found.push('exports an alias of contacts')
  if (/export\s+[^;]*from\s*['"][^'"]*(schema|live-contacts)['"]/.test(src)) found.push('re-exports the schema or live-contacts')
  return found
}

function relative(full: string) {
  return path.relative(root, full).split(path.sep).join('/')
}

test('no test file or script hands src a door to contacts, and src imports from neither', () => {
  const tests = sourceFilesAll(path.join(root, 'src')).filter((f) => /\.test\.ts$/.test(f))
  const scripts = sourceFilesAll(path.join(root, 'scripts'))
  const doors = [...tests, ...scripts]
    .map(relative)
    .filter((file) => file !== 'src/db/contacts-access.test.ts')
    .flatMap((file) => contactDoorExports(readFileSync(path.join(root, file), 'utf8')).map((why) => `${file}: ${why}`))
  expect(doors).toEqual([])
  const crossings = sourceFiles(path.join(root, 'src')).flatMap((full) => {
    const text = readFileSync(full, 'utf8')
    return /from\s*['"][^'"]*(\.test['"]|\.test\.ts['"]|scripts\/)/.test(text) ? [relative(full)] : []
  })
  expect(crossings).toEqual([])
})

test('the door check catches each way a test or script could export one', () => {
  const doors = [
    "export { contactsTable as people } from '@/db/live-contacts'",
    "export { contacts } from '@/db/schema'",
    "import { contacts } from '@/db/schema'\nexport { contacts as people }",
    "import { contactsTable } from '@/db/live-contacts'\nexport const people = contactsTable",
    "export * from '@/db/live-contacts'",
  ]
  for (const door of doors) expect(contactDoorExports(door), door).not.toEqual([])
  expect(contactDoorExports("import { contacts } from '@/db/schema'\nawait db.select().from(contacts)")).toEqual([])
})

test('every read of contacts goes through live-contacts, and only the allowlist sees deleted people', () => {
  const problems = sourceFiles(path.join(root, 'src')).flatMap((full) => {
    const file = path.relative(root, full).split(path.sep).join('/')
    return contactAccessViolations(file, readFileSync(full, 'utf8')).map((why) => `${file}: ${why}`)
  })
  expect(problems).toEqual([])
})

test('every allowlisted reader exists, gives a reason, and actually reads deleted people', () => {
  for (const [file, reason] of Object.entries(INCLUDE_DELETED_READERS)) {
    expect(reason.length).toBeGreaterThan(10)
    expect(readFileSync(path.join(root, file), 'utf8')).toContain('contactsIncludingDeleted')
  }
})

test('the checker catches each way around it', () => {
  const bad = {
    'plain read': `import { contacts } from '@/db/schema'\ndb.select().from(contacts)`,
    'raw SQL': 'await db.execute(sql`select email from contacts where id = ${id}`)',
    'raw SQL, schema-qualified': 'sql`select 1 from public.contacts`',
    'raw SQL, quoted': 'sql.raw(`select 1 from "public"."contacts" c`)',
    'table as a read source': `import { contactsTable } from '@/db/live-contacts'\ndb.select().from(contactsTable)`,
    'renamed on import': `import { contactsTable as people } from '@/db/live-contacts'\ndb.select().from(people)`,
    'aliased to a variable': `import { contactsTable } from '@/db/live-contacts'\nconst people = contactsTable\ndb.select().from(people)`,
    're-export': `export { contactsTable as people } from '@/db/live-contacts'`,
    'namespace import': `import * as live from '@/db/live-contacts'\ndb.select().from(live.contactsTable)`,
    'deleted rows, not allowlisted': `import { contactsIncludingDeleted } from '@/db/live-contacts'`,
    'column back to its table': `import { contactsTable } from '@/db/live-contacts'\ndb.select().from(contactsTable.id.table)`,
    'relational query': 'await db.query.contacts.findMany()',
    'column held in a variable': `import { contactsTable } from '@/db/live-contacts'\nconst col = contactsTable.id\ndb.select().from(col.table)`,
    'subquery internals': 'db.select().from((liveContacts as any)._.selectedFields.id.table)',
    'interpolated table': 'import { contactsTable } from \'@/db/live-contacts\'\nsql`select * from ${contactsTable}`',
  }
  for (const [name, src] of Object.entries(bad)) {
    expect(contactAccessViolations('src/app/example.ts', src), name).not.toEqual([])
  }
  expect(contactAccessViolations('src/app/example.ts', `import { liveContacts } from '@/db/live-contacts'\ndb.select().from(liveContacts)`)).toEqual([])
  expect(
    contactAccessViolations('src/app/example.ts', `import { contactsTable } from '@/db/live-contacts'\ndb.update(contactsTable).set({ name }).where(eq(contactsTable.id, id))`),
  ).toEqual([])
})
