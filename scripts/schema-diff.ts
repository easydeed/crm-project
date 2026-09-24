// Compares the public schema of two databases: a from-zero build and crm-dev.
// Default: exit 1 on any difference. --report prints the difference and exits 0,
// for pull requests, where crm-dev has not yet received the branch's migrations.
import { assertSafeDatabaseUrl } from '../src/config/database-url'
import { createPostgresClient } from '../src/db/client'

type Client = ReturnType<typeof createPostgresClient>

async function describe(client: Client) {
  const lines: string[] = []
  const columns = await client<{ line: string }[]>`
    select format('column %s.%s %s %s default %s', table_name, column_name, data_type || coalesce('(' || udt_name || ')', ''),
      case when is_nullable = 'YES' then 'null' else 'not null' end, coalesce(column_default, '-')) as line
    from information_schema.columns where table_schema = 'public'`
  const constraints = await client<{ line: string }[]>`
    select format('constraint %s %s %s', rel.relname, con.conname, pg_get_constraintdef(con.oid)) as line
    from pg_constraint con join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace where ns.nspname = 'public'`
  const indexes = await client<{ line: string }[]>`
    select format('index %s', indexdef) as line from pg_indexes where schemaname = 'public'`
  const enums = await client<{ line: string }[]>`
    select format('enum %s %s', t.typname, string_agg(e.enumlabel, ',' order by e.enumsortorder)) as line
    from pg_type t join pg_enum e on e.enumtypid = t.oid join pg_namespace ns on ns.oid = t.typnamespace
    where ns.nspname = 'public' group by t.typname`
  const tables = await client<{ line: string }[]>`
    select format('table %s', tablename) as line from pg_tables where schemaname = 'public'`
  const extensions = await client<{ line: string }[]>`
    select format('extension %s in %s', e.extname, n.nspname) as line
    from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname = 'pg_trgm'`
  // Triggers and our own functions carry behavior (subscribe_new_contact); extension functions are excluded.
  const triggers = await client<{ line: string }[]>`
    select format('trigger %s', pg_get_triggerdef(t.oid)) as line
    from pg_trigger t join pg_class rel on rel.oid = t.tgrelid join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public' and not t.tgisinternal`
  const functions = await client<{ line: string }[]>`
    select format('function %s', regexp_replace(pg_get_functiondef(p.oid), '[[:space:]]+', ' ', 'g')) as line
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public'
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')`
  for (const set of [tables, columns, constraints, indexes, enums, extensions, triggers, functions]) {
    for (const row of set) lines.push(row.line)
  }
  return new Set(lines)
}

function urlFrom(name: string) {
  const url = process.env[name]
  if (!url) throw new Error(`${name} is not set`)
  assertSafeDatabaseUrl(url)
  return url
}

async function main() {
  const report = process.argv.includes('--report')
  const zero = createPostgresClient(urlFrom('DRIFT_ZERO_URL'))
  const dev = createPostgresClient(urlFrom('DRIFT_DEV_URL'))
  try {
    const [fromZero, crmDev] = await Promise.all([describe(zero), describe(dev)])
    const onlyZero = [...fromZero].filter((line) => !crmDev.has(line)).sort()
    const onlyDev = [...crmDev].filter((line) => !fromZero.has(line)).sort()
    for (const line of onlyZero) console.log(`- missing on crm-dev: ${line}`)
    for (const line of onlyDev) console.log(`+ only on crm-dev:    ${line}`)
    const total = onlyZero.length + onlyDev.length
    console.log(total ? `Schema drift: ${total} difference(s).` : 'No schema drift.')
    if (total && !report) process.exitCode = 1
  } finally {
    await Promise.all([zero.end({ timeout: 5 }), dev.end({ timeout: 5 })])
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
