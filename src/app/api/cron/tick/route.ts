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

export async function POST(request: Request) {
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
