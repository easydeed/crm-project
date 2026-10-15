import { NextResponse } from 'next/server'
import { runDueJobs } from '@/jobs/run'
import { scheduleMonthlyWork } from '@/jobs/schedule'

const DEFAULT_LIMIT = 10

function cronSecretOk(request: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  const header = request.headers.get('x-cron-secret')
  if (header === expected) return true
  const auth = request.headers.get('authorization')
  if (auth === `Bearer ${expected}`) return true
  return false
}

/**
 * Vercel Cron calls this path with GET, sending CRON_SECRET as `Authorization: Bearer …`
 * (vercel.com/docs/cron-jobs). Until OR-051 the route answered POST only, so every cron call got a
 * 405 and the job runner never ran on Vercel. POST stays for a manual run; both share one check.
 */
export const dynamic = 'force-dynamic'

export const GET = undefined as unknown as (request: Request) => Promise<Response>

export async function POST(request: Request) {
  return tick(request)
}

async function tick(request: Request) {
  if (!cronSecretOk(request)) {
    return new NextResponse(null, { status: 404 })
  }

  const url = new URL(request.url)
  const raw = url.searchParams.get('limit')
  const limit = Math.min(Math.max(Number(raw) || DEFAULT_LIMIT, 1), 50)
  await scheduleMonthlyWork()
  const ran = await runDueJobs(limit)
  return NextResponse.json({ ran })
}
