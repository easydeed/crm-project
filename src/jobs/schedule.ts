import { and, eq } from 'drizzle-orm'
import { isSendDay, isSendTime, isTimezone } from '@/config/settings'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, sends } from '@/db/schema'
import { enqueue } from '@/jobs/enqueue'
import { addDays, atLocalTime, localDate } from '@/jobs/schedule-time'

type Db = ReturnType<typeof getRuntimeDb>['db']

type AccountClock = {
  id: string
  sendDay: number
  sendTime: string
  timezone: string
}

async function ensureSend(db: Db, accountId: string, scheduledFor: Date) {
  await db
    .insert(sends)
    .values({ accountId, scheduledFor, state: 'scheduled' })
    .onConflictDoNothing({ target: [sends.accountId, sends.scheduledFor] })
  const [row] = await db
    .select()
    .from(sends)
    .where(and(eq(sends.accountId, accountId), eq(sends.scheduledFor, scheduledFor)))
    .limit(1)
  if (!row) throw new Error('Could not create the send')
  return row
}

async function enqueueCallList(account: AccountClock, day: { year: number; month: number; day: number }) {
  const scheduledFor = atLocalTime(day, account.sendTime, account.timezone)
  await enqueue('build_call_lists', { accountId: account.id, asOf: scheduledFor.toISOString() }, scheduledFor)
}

async function queueForDay(db: Db, account: AccountClock, day: { year: number; month: number; day: number }, nowIsSendDay: boolean) {
  const scheduledFor = atLocalTime(day, account.sendTime, account.timezone)
  const send = await ensureSend(db, account.id, scheduledFor)
  if (nowIsSendDay) await enqueueCallList(account, day)
  if (send.state === 'skipped' || send.state === 'done') return

  if (send.state === 'scheduled') {
    const composeDay = addDays(day, -1)
    await enqueue(
      'compose',
      { accountId: account.id, sendId: send.id },
      atLocalTime(composeDay, '00:00', account.timezone),
    )
  }
  if (nowIsSendDay && (send.state === 'scheduled' || send.state === 'ready')) {
    await enqueue('send', { sendId: send.id }, scheduledFor)
  }
}

async function scheduleAccount(db: Db, account: AccountClock, now: Date, paused: boolean) {
  const today = localDate(now, account.timezone)
  // A pause stops mail to homeowners. It never takes away the agent's call list.
  if (paused) {
    if (today.day === account.sendDay) await enqueueCallList(account, today)
    return
  }
  const tomorrow = addDays(today, 1)
  if (tomorrow.day === account.sendDay) {
    await queueForDay(db, account, tomorrow, false)
  }
  if (today.day === account.sendDay) {
    await queueForDay(db, account, today, true)
  }
}

/** Called from the cron tick. Enqueue is idempotent for the same run time. */
export async function scheduleAccountById(accountId: string, now = new Date()) {
  const { db } = getRuntimeDb()
  const [row] = await db
    .select({
      id: accounts.id,
      sendDay: accounts.sendDay,
      sendTime: accounts.sendTime,
      timezone: accounts.timezone,
      paused: accounts.paused,
    })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1)
  if (!row || row.sendDay == null || !row.sendTime || !row.timezone) return
  if (!isSendDay(row.sendDay) || !isSendTime(row.sendTime) || !isTimezone(row.timezone)) return
  await scheduleAccount(
    db,
    { id: row.id, sendDay: row.sendDay, sendTime: row.sendTime, timezone: row.timezone },
    now,
    row.paused,
  )
}

export async function scheduleMonthlyWork(now = new Date()) {
  const { db } = getRuntimeDb()
  const rows = await db.select({ id: accounts.id }).from(accounts)
  for (const row of rows) {
    await scheduleAccountById(row.id, now)
  }
}
