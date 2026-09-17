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

export function loadEnvFiles() {
  applyEnvFile('.env', false)
  applyEnvFile('.env.local', true)
}

export function assertSafeDatabaseUrl(url: string) {
  if (/:6543(?:\/|$|\?)/.test(url)) {
    throw new Error(
      'DATABASE_URL must be the session pooler on port 5432, not the transaction pooler (6543).',
    )
  }
  if (url.includes(CRM_PROD_REF)) {
    throw new Error('DATABASE_URL points at the crm project. Use crm-dev only.')
  }
}

export function assertSafePoolerUrl(url: string) {
  if (!/:6543(?:\/|$|\?)/.test(url) || !url.includes('pooler.supabase.com')) {
    throw new Error(
      'DATABASE_POOLER_URL must be the transaction pooler on port 6543.',
    )
  }
  if (url.includes(CRM_PROD_REF)) {
    throw new Error('DATABASE_POOLER_URL points at the crm project. Use crm-dev only.')
  }
}

export function loadDatabaseUrl() {
  loadEnvFiles()
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  assertSafeDatabaseUrl(url)
  return url
}

export function loadDatabasePoolerUrl() {
  loadEnvFiles()
  const url = process.env.DATABASE_POOLER_URL
  if (!url) throw new Error('DATABASE_POOLER_URL is not set')
  assertSafePoolerUrl(url)
  return url
}

export function usesTransactionPooler(url: string) {
  return /:6543(?:\/|$|\?)/.test(url)
}
