import { and, eq } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, sends } from '@/db/schema'
import { enqueue } from '@/jobs/enqueue'
import { nextSendInstant } from '@/jobs/schedule-time'
import { isSendDay, isSendTime, isTimezone } from '@/config/settings'

async function upcoming(accountId: string, now: Date) {
  const { db } = getRuntimeDb()
  const [account] = await db
    .select({
      sendDay: accounts.sendDay,
      sendTime: accounts.sendTime,
      timezone: accounts.timezone,
    })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1)
  if (!account?.sendDay || !account.sendTime || !account.timezone) return null
  if (!isSendDay(account.sendDay) || !isSendTime(account.sendTime) || !isTimezone(account.timezone)) {
    return null
  }
  const scheduledFor = nextSendInstant(now, account.sendDay, account.sendTime, account.timezone)
  await db
    .insert(sends)
    .values({ accountId, scheduledFor, state: 'scheduled' })
    .onConflictDoNothing({ target: [sends.accountId, sends.scheduledFor] })
  const [send] = await db
    .select()
    .from(sends)
    .where(and(eq(sends.accountId, accountId), eq(sends.scheduledFor, scheduledFor)))
    .limit(1)
  return send ?? null
}

export async function skipUpcomingSend(accountId: string, now = new Date()) {
  const { db } = getRuntimeDb()
  const send = await upcoming(accountId, now)
  if (!send || send.state === 'done') return
  await db.update(sends).set({ state: 'skipped' }).where(eq(sends.id, send.id))
}

export async function resumeUpcomingSend(accountId: string, now = new Date()) {
  const { db } = getRuntimeDb()
  const send = await upcoming(accountId, now)
  if (!send || send.state !== 'skipped') return
  const composed = send.composedCount > 0
  await db
    .update(sends)
    .set({ state: composed ? 'ready' : 'scheduled' })
    .where(eq(sends.id, send.id))
  if (!composed) {
    await enqueue('compose', { accountId, sendId: send.id }, now)
  }
  if (send.scheduledFor.getTime() <= now.getTime()) {
    await enqueue('send', { sendId: send.id }, now)
  }
}

export async function unpauseAccount(accountId: string) {
  const { db } = getRuntimeDb()
  await db.update(accounts).set({ paused: false }).where(eq(accounts.id, accountId))
}
