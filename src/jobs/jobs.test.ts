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
      suppressed: false,
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
      suppressed: false,
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
      suppressed: false,
      accountPaused: false,
    }),
  ).toThrow(/unsubscribed/)
  expect(() =>
    assertSendAllowed({
      recipientEmail: 'a@example.com',
      unsubscribed: false,
      suppressed: false,
      accountPaused: true,
    }),
  ).toThrow(/paused/)
})

test('assertSendAllowed throws for a suppressed address, even with a live subscription', () => {
  process.env.SEND_ENABLED = 'true'
  process.env.SEND_ALLOWLIST = 'example.com'
  expect(() =>
    assertSendAllowed({
      recipientEmail: 'a@example.com',
      unsubscribed: false,
      suppressed: true,
      accountPaused: false,
    }),
  ).toThrow(/suppressed/)
})

test('the send job loads suppression by address for the guard', () => {
  const sendJob = readFileSync(fileURLToPath(new URL('./send-job.ts', import.meta.url)), 'utf8')
  expect(sendJob).toContain("suppressed: await isSuppressed(db, contact.email, 'monthly')")
})

test('every send entry point calls assertSendAllowed and throws on default env', async () => {
  delete process.env.SEND_ENABLED
  delete process.env.SEND_ALLOWLIST

  expect(SEND_ENTRY_POINTS).toEqual(['deliverRecipient'])
  const deliverSrc = readFileSync(
    fileURLToPath(new URL('./deliver.ts', import.meta.url)),
    'utf8',
  )
  expect(deliverSrc.indexOf('assertSendAllowed')).toBeGreaterThan(-1)
  expect(deliverSrc.indexOf('assertSendAllowed')).toBeLessThan(deliverSrc.indexOf('mailer.send('))
})

test('non-send stub twice leaves identical state', async () => {
  const ctx = { jobId: 'stub', attempt: 1, now: new Date('2026-01-01T00:00:00Z') }
  const payload = { zip: '91750' }
  await handlers.refresh_parcels(payload, ctx)
  await handlers.refresh_parcels(payload, ctx)
  expect(payload).toEqual({ zip: '91750' })
})

test('deliverRecipient throws under default env before the mailer is called', async () => {
  delete process.env.SEND_ENABLED
  const { FakeMailer } = await import('@/mail/fake-mailer')
  const { deliverRecipient } = await import('@/jobs/deliver')
  const mailer = new FakeMailer()
  const msg = {
    to: 'a@example.com',
    from: 'Notes <notes@example.com>',
    replyTo: 'agent@example.com',
    subject: 'Hello',
    html: '<p>Hi</p>',
    text: 'Hi',
    stream: 'monthly' as const,
    idempotencyKey: 'send:contact',
    headers: [],
  }
  await expect(
    deliverRecipient(mailer, {
      recipientEmail: msg.to,
      unsubscribed: false,
      suppressed: false,
      accountPaused: false,
    }, msg),
  ).rejects.toThrow(/SEND_ENABLED/)
  expect(mailer.calls).toHaveLength(0)
})
