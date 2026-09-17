import { existsSync, readFileSync } from 'node:fs'

const CRM_PROD_REF = 'eajfpzavqvcvwkeicdww'

function applyEnvFile(path: string, overwrite: boolean) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    const value = trimmed.slice(eq + 1).replace(/^['"]|['"]$/g, '')
    if (overwrite || !process.env[key]) process.env[key] = value
  }
}

export function assertSafeDatabaseUrl(url: string) {
  if (url.includes('pooler.supabase.com') || /:6543(?:\/|$|\?)/.test(url)) {
    throw new Error(
      'DATABASE_URL must be the direct db.<ref>.supabase.co:5432 connection, not the transaction pooler.',
    )
  }
  if (url.includes(CRM_PROD_REF)) {
    throw new Error('DATABASE_URL points at the crm project. Use crm-dev only.')
  }
}

export function loadDatabaseUrl() {
  applyEnvFile('.env', false)
  applyEnvFile('.env.local', true)
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  assertSafeDatabaseUrl(url)
  return url
}
