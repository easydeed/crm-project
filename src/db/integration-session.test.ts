import { expect, test } from 'vitest'
import { usesTransactionPooler } from '@/config/database-url'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'

test('integration URL helper never accepts the transaction pooler', () => {
  expect(
    usesTransactionPooler(
      'postgresql://postgres.ref:x@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
    ),
  ).toBe(true)
  const url = tryLoadIntegrationDatabaseUrl()
  if (url) {
    expect(usesTransactionPooler(url)).toBe(false)
    expect(url).toMatch(/:5432(?:\/|$|\?)/)
  }
})
