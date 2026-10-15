import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

// The scheduler and the runner touch the database. Here only the route's door is under test: what
// it lets through, and that what it lets through reaches them.
vi.mock('@/jobs/schedule', () => ({ scheduleMonthlyWork: vi.fn(async () => {}) }))
vi.mock('@/jobs/run', () => ({ runDueJobs: vi.fn(async () => 0) }))

const { GET, POST } = await import('@/app/api/cron/tick/route')
const { scheduleMonthlyWork } = await import('@/jobs/schedule')
const { runDueJobs } = await import('@/jobs/run')

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..')
const SECRET = 'test-cron-secret'
const savedSecret = process.env.CRON_SECRET

/**
 * OR-051. What Vercel sends, from vercel.com/docs/cron-jobs: "Vercel makes an HTTP GET request to
 * your project's production deployment URL", with CRON_SECRET "automatically sent as an
 * Authorization header" carrying "the Bearer prefix", a `vercel-cron/1.0` user agent and an
 * `x-vercel-cron-schedule` header. The route answered POST only until OR-051: every cron call was a
 * 405, and the one test here called POST directly.
 */
const VERCEL_METHOD = 'GET'
function vercelRequest(headers: Record<string, string> = {}) {
  return new Request('https://example.vercel.app/api/cron/tick', {
    method: VERCEL_METHOD,
    headers: { 'user-agent': 'vercel-cron/1.0', 'x-vercel-cron-schedule': '0 9 * * *', ...headers },
  })
}

beforeEach(() => {
  process.env.CRON_SECRET = SECRET
  vi.mocked(scheduleMonthlyWork).mockClear()
  vi.mocked(runDueJobs).mockClear()
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

test('every cron path in vercel.json is a route that answers the method Vercel calls it with', async () => {
  const crons = (JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8')) as { crons?: { path: string }[] }).crons ?? []
  expect(crons.length).toBeGreaterThan(0)
  for (const cron of crons) {
    const file = path.join(root, 'src/app', cron.path, 'route.ts')
    expect(existsSync(file), `${cron.path} has no route.ts`).toBe(true)
    const route = (await import(/* @vite-ignore */ file)) as Record<string, unknown>
    expect(typeof route[VERCEL_METHOD], `${cron.path} exports no ${VERCEL_METHOD}`).toBe('function')
    // A cached reply would answer the cron without doing the work.
    expect(route.dynamic, `${cron.path} must not be cached`).toBe('force-dynamic')
  }
})

test("a request shaped like Vercel's cron runs the scheduler and the runner", async () => {
  const response = await GET(vercelRequest({ authorization: `Bearer ${SECRET}` }))
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ ran: 0 })
  expect(scheduleMonthlyWork).toHaveBeenCalledTimes(1)
  expect(runDueJobs).toHaveBeenCalledTimes(1)
})

test('the same request without the secret, with a wrong one, or with the schedule header alone runs nothing', async () => {
  const attempts: Record<string, string>[] = [{}, { authorization: 'Bearer wrong' }, { authorization: SECRET }, { 'x-cron-secret': 'wrong' }]
  for (const headers of attempts) {
    const response = await GET(vercelRequest(headers))
    expect(response.status, JSON.stringify(headers)).toBe(404)
  }
  delete process.env.CRON_SECRET
  expect((await GET(vercelRequest({ authorization: 'Bearer ' }))).status).toBe(404)
  expect(scheduleMonthlyWork).not.toHaveBeenCalled()
  expect(runDueJobs).not.toHaveBeenCalled()
})
