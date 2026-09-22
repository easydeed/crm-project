import { afterEach, beforeEach, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { MAX_ATTEMPTS, retryDelayMs } from '@/jobs/backoff'
import { canonicalizeJson, payloadKeyFrom } from '@/jobs/payload-key'
import { handlers } from '@/jobs/registry'
import { assertSendAllowed } from '@/jobs/send-guard'
import { SEND_ENTRY_POINTS } from '@/jobs/types'

const envKeys = ['SEND_ENABLED', 'SEND_ALLOWLIST', 'VERCEL_ENV'] as const

const saved: Partial<Record<(typeof envKeys)[number], string | undefined>> = {}

beforeEach(() => {
  for (const key of envKeys) saved[key] = process.env[key]
})

afterEach(() => {
  for (const key of envKeys) {
    const value = saved[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

test('retry delays: 1m, 5m, 30m then dead after four attempts', () => {
  expect(MAX_ATTEMPTS).toBe(4)
  expect(retryDelayMs(1)).toBe(60_000)
  expect(retryDelayMs(2)).toBe(5 * 60_000)
  expect(retryDelayMs(3)).toBe(30 * 60_000)
  expect(retryDelayMs(4)).toBeNull()
  expect(retryDelayMs(5)).toBeNull()
})

test('payload key is stable across key order', () => {
  const a = payloadKeyFrom({ b: 1, a: 2 })
  const b = payloadKeyFrom({ a: 2, b: 1 })
  expect(a).toBe(b)
  expect(canonicalizeJson({ z: true, a: [2, 1] })).toBe(
    canonicalizeJson({ a: [2, 1], z: true }),
  )
})

test('assertSendAllowed throws under default env', () => {
  delete process.env.SEND_ENABLED
  delete process.env.SEND_ALLOWLIST
  expect(() =>
    assertSendAllowed({
      recipientEmail: 'a@example.com',
      unsubscribed: false,
      accountPaused: false,
    }),
  ).toThrow(/SEND_ENABLED/)
})

test('assertSendAllowed throws for domain outside allowlist', () => {
  process.env.SEND_ENABLED = 'true'
  process.env.SEND_ALLOWLIST = 'allowed.test'
  expect(() =>
    assertSendAllowed({
      recipientEmail: 'a@other.test',
      unsubscribed: false,
      accountPaused: false,
    }),
  ).toThrow(/allowlist/)
})

test('assertSendAllowed throws for unsubscribed and paused', () => {
  process.env.SEND_ENABLED = 'true'
  process.env.SEND_ALLOWLIST = 'example.com'
  expect(() =>
    assertSendAllowed({
      recipientEmail: 'a@example.com',
      unsubscribed: true,
      accountPaused: false,
    }),
  ).toThrow(/unsubscribed/)
  expect(() =>
    assertSendAllowed({
      recipientEmail: 'a@example.com',
      unsubscribed: false,
      accountPaused: true,
    }),
  ).toThrow(/paused/)
})

test('every send entry point calls assertSendAllowed and throws on default env', async () => {
  delete process.env.SEND_ENABLED
  delete process.env.SEND_ALLOWLIST

  expect(SEND_ENTRY_POINTS).toEqual(['handlers.send'])
  const registrySrc = readFileSync(
    fileURLToPath(new URL('./registry.ts', import.meta.url)),
    'utf8',
  )
  expect(registrySrc).toContain('assertSendAllowed')
  expect(registrySrc).toMatch(/send:\s*sendStub/)

  await expect(
    handlers.send(
      { recipientEmail: 'homeowner@example.com' },
      { jobId: 'test', attempt: 1, now: new Date() },
    ),
  ).rejects.toThrow(/SEND_ENABLED/)
})

test('non-send stub twice leaves identical state', async () => {
  const ctx = { jobId: 'stub', attempt: 1, now: new Date('2026-01-01T00:00:00Z') }
  const payload = { zip: '91750' }
  await handlers.refresh_parcels(payload, ctx)
  await handlers.refresh_parcels(payload, ctx)
  expect(payload).toEqual({ zip: '91750' })
})

test('send stub throws both times under default env and writes nothing', async () => {
  delete process.env.SEND_ENABLED
  const payload = { recipientEmail: 'a@example.com', marker: 1 }
  await expect(
    handlers.send(payload, { jobId: 's1', attempt: 1, now: new Date() }),
  ).rejects.toThrow(/SEND_ENABLED/)
  await expect(
    handlers.send(payload, { jobId: 's1', attempt: 2, now: new Date() }),
  ).rejects.toThrow(/SEND_ENABLED/)
  expect(payload).toEqual({ recipientEmail: 'a@example.com', marker: 1 })
})
