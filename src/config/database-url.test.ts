import { expect, test } from 'vitest'
import { assertSafeDatabaseUrl } from '@/config/database-url'

test('rejects the transaction pooler', () => {
  expect(() =>
    assertSafeDatabaseUrl(
      'postgresql://postgres:x@db.xxxx.pooler.supabase.com:6543/postgres',
    ),
  ).toThrow(/direct/)
  expect(() =>
    assertSafeDatabaseUrl('postgresql://postgres:x@example.com:6543/postgres'),
  ).toThrow(/direct/)
})

test('rejects the crm production project ref', () => {
  expect(() =>
    assertSafeDatabaseUrl(
      'postgresql://postgres:x@db.eajfpzavqvcvwkeicdww.supabase.co:5432/postgres',
    ),
  ).toThrow(/crm-dev/)
})

test('allows a direct supabase connection that is not crm', () => {
  expect(() =>
    assertSafeDatabaseUrl(
      'postgresql://postgres:x@db.exampleproject.supabase.co:5432/postgres',
    ),
  ).not.toThrow()
})
