import { expect, test } from 'vitest'
import {
  assertSafeDatabaseUrl,
  assertSafePoolerUrl,
  usesTransactionPooler,
} from '@/config/database-url'

test('rejects the transaction pooler for DATABASE_URL', () => {
  expect(() =>
    assertSafeDatabaseUrl(
      'postgresql://postgres.ref:x@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
    ),
  ).toThrow(/5432/)
})

test('allows the session pooler on port 5432', () => {
  expect(() =>
    assertSafeDatabaseUrl(
      'postgresql://postgres.ref:x@aws-0-us-west-2.pooler.supabase.com:5432/postgres',
    ),
  ).not.toThrow()
})

test('rejects the crm production project ref', () => {
  expect(() =>
    assertSafeDatabaseUrl(
      'postgresql://postgres:x@db.eajfpzavqvcvwkeicdww.supabase.co:5432/postgres',
    ),
  ).toThrow(/crm-dev/)
})

test('DATABASE_POOLER_URL must be the 6543 transaction pooler', () => {
  expect(() =>
    assertSafePoolerUrl(
      'postgresql://postgres.ref:x@aws-0-us-west-2.pooler.supabase.com:5432/postgres',
    ),
  ).toThrow(/6543/)
  expect(() =>
    assertSafePoolerUrl(
      'postgresql://postgres.ref:x@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
    ),
  ).not.toThrow()
})

test('usesTransactionPooler detects port 6543', () => {
  expect(
    usesTransactionPooler(
      'postgresql://postgres.ref:x@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
    ),
  ).toBe(true)
  expect(
    usesTransactionPooler(
      'postgresql://postgres.ref:x@aws-0-us-west-2.pooler.supabase.com:5432/postgres',
    ),
  ).toBe(false)
})
