import { and, eq, isNull, ne, sql } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, contactSubscriptions, sends } from '@/db/schema'
import { liveContacts } from '@/db/live-contacts'
import { formatSendDay, nextEmailSentence, nextSendInstant } from '@/jobs/schedule-time'
import { isSendDay, isSendTime, isTimezone } from '@/config/settings'
import { systemPauseState } from '@/db/system-pause'
import { loadBillingState } from '@/billing/load-state'
import { billingIssue, type BillingIssue } from '@/billing/status'

export type HomeSend =
  | { kind: 'missing-account' }
  | { kind: 'billing'; issue: BillingIssue }
  | { kind: 'paused' }
  | { kind: 'system-paused' }
  | { kind: 'settings' }
  | { kind: 'import' }
  | { kind: 'review' }
  | { kind: 'none-subscribed' }
  | { kind: 'skipped'; when: string }
  | { kind: 'scheduled'; sentence: string; previewContactId: string | null }

const eligible = and(
  eq(liveContacts.status, 'matched'),
  sql`${liveContacts.parcelId} is not null`,
  eq(contactSubscriptions.scope, 'monthly'),
  isNull(contactSubscriptions.unsubscribedAt),
)

export async function loadHomeSend(accountId: string, now = new Date()): Promise<HomeSend> {
  const { db } = getRuntimeDb()
  const [account] = await db
    .select({
      paused: accounts.paused,
      sendDay: accounts.sendDay,
      sendTime: accounts.sendTime,
      timezone: accounts.timezone,
    })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1)
  if (!account) return { kind: 'missing-account' }
  const issue = billingIssue(await loadBillingState(db, accountId), now)
  if (issue) return { kind: 'billing', issue }
  if (account.paused) {
    if (await systemPauseState(accountId)) return { kind: 'system-paused' }
    return { kind: 'paused' }
  }
  if (
    account.sendDay == null ||
    !account.sendTime ||
    !account.timezone ||
    !isSendDay(account.sendDay) ||
    !isSendTime(account.sendTime) ||
    !isTimezone(account.timezone)
  ) {
    return { kind: 'settings' }
  }

  const [people] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(liveContacts)
    .where(eq(liveContacts.accountId, accountId))
  if (!people?.count) return { kind: 'import' }

  const [ready] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(liveContacts)
    .innerJoin(contactSubscriptions, eq(contactSubscriptions.contactId, liveContacts.id))
    .where(and(eq(liveContacts.accountId, accountId), eligible))
  const count = ready?.count ?? 0
  if (count === 0) {
    const [open] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(liveContacts)
      .where(and(eq(liveContacts.accountId, accountId), ne(liveContacts.status, 'matched')))
    return (open?.count ?? 0) > 0 ? { kind: 'review' } : { kind: 'none-subscribed' }
  }

  const scheduledFor = nextSendInstant(now, account.sendDay, account.sendTime, account.timezone)
  const when = formatSendDay(scheduledFor, account.timezone)
  const [send] = await db
    .select({ state: sends.state })
    .from(sends)
    .where(and(eq(sends.accountId, accountId), eq(sends.scheduledFor, scheduledFor)))
    .limit(1)
  if (send?.state === 'skipped') return { kind: 'skipped', when }

  const [first] = await db
    .select({ id: liveContacts.id })
    .from(liveContacts)
    .innerJoin(contactSubscriptions, eq(contactSubscriptions.contactId, liveContacts.id))
    .where(and(eq(liveContacts.accountId, accountId), eligible))
    .orderBy(liveContacts.name)
    .limit(1)

  return {
    kind: 'scheduled',
    sentence: nextEmailSentence(when, count),
    previewContactId: first?.id ?? null,
  }
}
