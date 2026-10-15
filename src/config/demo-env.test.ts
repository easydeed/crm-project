import { expect, test } from 'vitest'
import { readDemoEnv } from '@/config/demo-env'

const URL = 'postgresql://postgres.demo:x@aws-0-us-west-2.pooler.supabase.com:5432/postgres'
const PASSWORD = 'a-demo-password'

test('reads the two demo secrets', () => {
  expect(readDemoEnv({ PREVIEW_DATABASE_URL: URL, DEMO_AGENT_PASSWORD: PASSWORD })).toEqual({ url: URL, password: PASSWORD })
})

test('never falls back to DATABASE_URL', () => {
  expect(() => readDemoEnv({ DATABASE_URL: URL, DEMO_AGENT_PASSWORD: PASSWORD })).toThrow('PREVIEW_DATABASE_URL is not set.')
})

test('refuses the dev database under the demo name', () => {
  expect(() => readDemoEnv({ DATABASE_URL: URL, PREVIEW_DATABASE_URL: URL, DEMO_AGENT_PASSWORD: PASSWORD })).toThrow(/same as DATABASE_URL/)
})

test('holds the demo URL to the DATABASE_URL rules', () => {
  const transaction = URL.replace(':5432', ':6543')
  expect(() => readDemoEnv({ PREVIEW_DATABASE_URL: transaction, DEMO_AGENT_PASSWORD: PASSWORD })).toThrow(/^PREVIEW_DATABASE_URL: must be the session pooler/)
  const crm = 'postgresql://postgres.eajfpzavqvcvwkeicdww:x@aws-0-us-west-2.pooler.supabase.com:5432/postgres'
  expect(() => readDemoEnv({ PREVIEW_DATABASE_URL: crm, DEMO_AGENT_PASSWORD: PASSWORD })).toThrow(/crm project/)
})

test("holds the password to the app's own rule, and never prints it", () => {
  expect(() => readDemoEnv({ PREVIEW_DATABASE_URL: URL })).toThrow('DEMO_AGENT_PASSWORD is not set.')
  const short = 'short-pw'
  let message = ''
  try {
    readDemoEnv({ PREVIEW_DATABASE_URL: URL, DEMO_AGENT_PASSWORD: short })
  } catch (err) {
    message = (err as Error).message
  }
  expect(message).toMatch(/at least 10 characters/)
  expect(message).not.toContain(short)
  expect(() => readDemoEnv({ PREVIEW_DATABASE_URL: URL, DEMO_AGENT_PASSWORD: 'ten-chars!' })).not.toThrow()
})
