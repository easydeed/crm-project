import {
  loadDatabaseUrl,
  usesTransactionPooler,
} from '@/config/database-url'

export function tryLoadIntegrationDatabaseUrl(): string | null {
  try {
    const url = loadDatabaseUrl()
    if (usesTransactionPooler(url)) {
      throw new Error(
        'Integration tests must use DATABASE_URL on port 5432, not 6543.',
      )
    }
    return url
  } catch {
    return null
  }
}
