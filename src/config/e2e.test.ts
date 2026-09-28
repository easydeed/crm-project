import { afterEach, expect, test, vi } from 'vitest'
import { isLocalDatabaseUrl } from '@/config/database-url'
import { isLocalE2E } from '@/config/e2e'

afterEach(() => {
  vi.unstubAllEnvs()
})

test('a database on this machine is local', () => {
  expect(isLocalDatabaseUrl('postgres://postgres@localhost:5432/postgres')).toBe(true)
  expect(isLocalDatabaseUrl('postgres://postgres@127.0.0.1:5432/postgres?sslmode=require')).toBe(true)
  expect(isLocalDatabaseUrl('postgres://postgres@[::1]:5432/postgres')).toBe(true)
})

test('any other host is not, even one that mentions localhost', () => {
  expect(isLocalDatabaseUrl('postgresql://postgres.ref:x@aws-0-us-west-2.pooler.supabase.com:5432/postgres')).toBe(false)
  expect(isLocalDatabaseUrl('postgres://localhost.evil.example:5432/postgres')).toBe(false)
  expect(isLocalDatabaseUrl('postgres://u:localhost@db.example.com/postgres')).toBe(false)
  expect(isLocalDatabaseUrl('not a url')).toBe(false)
  expect(isLocalDatabaseUrl(undefined)).toBe(false)
})

test('the e2e flag alone does not switch a remote database to the e2e path', () => {
  vi.stubEnv('ONRECORD_E2E', '1')
  vi.stubEnv('DATABASE_URL', 'postgresql://postgres.ref:x@aws-0-us-west-2.pooler.supabase.com:5432/postgres')
  expect(isLocalE2E()).toBe(false)
})

test('e2e needs both the flag and a local database', () => {
  vi.stubEnv('DATABASE_URL', 'postgres://postgres@localhost:5432/postgres')
  vi.stubEnv('ONRECORD_E2E', '')
  expect(isLocalE2E()).toBe(false)
  vi.stubEnv('ONRECORD_E2E', '1')
  expect(isLocalE2E()).toBe(true)
})
