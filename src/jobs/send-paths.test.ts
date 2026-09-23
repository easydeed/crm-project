import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { atLocalTime, nextEmailSentence, nextSendInstant } from '@/jobs/schedule-time'
import { bounceKind, webhookSecretOk } from '@/mail/postmark-webhook'
import { POST } from '@/app/api/webhooks/postmark/route'

function walk(dir: string): string[] {
  const found: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      if (name === 'node_modules') continue
      found.push(...walk(path))
    } else if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      found.push(path)
    }
  }
  return found
}

test('mailer.send is only reached after assertSendAllowed', () => {
  const srcRoot = fileURLToPath(new URL('..', import.meta.url))
  const callers = walk(srcRoot).filter((file) => {
    if (file.includes('.test.') || file.includes(`${join('mail', 'fake-mailer')}`)) return false
    if (file.endsWith(`${join('mail', 'postmark-mailer.ts')}`)) return false
    const text = readFileSync(file, 'utf8')
    return text.includes('mailer.send(')
  })
  const normalized = callers.map((file) => file.replace(/\\/g, '/'))
  expect(normalized).toEqual([expect.stringMatching(/jobs\/deliver\.ts$/)])
  const deliver = readFileSync(callers[0], 'utf8')
  expect(deliver.indexOf('assertSendAllowed')).toBeLessThan(deliver.indexOf('mailer.send('))
})

test('Los Angeles send time converts to the right UTC instant', () => {
  const instant = atLocalTime(
    { year: 2026, month: 9, day: 15 },
    '09:00',
    'America/Los_Angeles',
  )
  expect(instant.toISOString()).toBe('2026-09-15T16:00:00.000Z')
})

test('next send is the upcoming 1st or 15th', () => {
  const now = new Date('2026-09-14T20:00:00.000Z')
  const next = nextSendInstant(now, 15, '09:00', 'America/Los_Angeles')
  expect(next.toISOString()).toBe('2026-09-15T16:00:00.000Z')
  expect(nextEmailSentence('September 15', 1)).toBe(
    'Your next email goes out September 15 to 1 homeowner.',
  )
  expect(nextEmailSentence('September 15', 3)).toContain('3 homeowners')
})

test('hard bounce and spam complaint are the only stop events', () => {
  expect(bounceKind({ RecordType: 'Bounce', Type: 'HardBounce' })).toBe('hard_bounce')
  expect(bounceKind({ RecordType: 'Bounce', TypeCode: 1 })).toBe('hard_bounce')
  expect(bounceKind({ RecordType: 'SpamComplaint', Email: 'a@b.com' })).toBe('spam_complaint')
  expect(bounceKind({ RecordType: 'Bounce', Type: 'Transient' })).toBeNull()
})

test('postmark webhook returns 404 without the secret', async () => {
  const previous = process.env.POSTMARK_WEBHOOK_SECRET
  process.env.POSTMARK_WEBHOOK_SECRET = 'hook-secret'
  const missing = await POST(
    new Request('http://localhost/api/webhooks/postmark', { method: 'POST' }),
  )
  expect(missing.status).toBe(404)
  const wrong = webhookSecretOk(
    new Request('http://localhost', { headers: { 'x-postmark-webhook-secret': 'nope' } }),
  )
  expect(wrong).toBe(false)
  if (previous === undefined) delete process.env.POSTMARK_WEBHOOK_SECRET
  else process.env.POSTMARK_WEBHOOK_SECRET = previous
})
