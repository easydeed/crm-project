import { afterEach, beforeEach, expect, test } from 'vitest'
import { POST } from '@/app/api/cron/tick/route'

const savedSecret = process.env.CRON_SECRET

beforeEach(() => {
  process.env.CRON_SECRET = 'test-cron-secret'
})

afterEach(() => {
  if (savedSecret === undefined) delete process.env.CRON_SECRET
  else process.env.CRON_SECRET = savedSecret
})

test('cron tick returns 404 without correct secret', async () => {
  const missing = await POST(new Request('http://localhost/api/cron/tick', { method: 'POST' }))
  expect(missing.status).toBe(404)

  const wrong = await POST(
    new Request('http://localhost/api/cron/tick', {
      method: 'POST',
      headers: { 'x-cron-secret': 'wrong' },
    }),
  )
  expect(wrong.status).toBe(404)
})
