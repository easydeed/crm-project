import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { blocksInStoredHtml, groupSkipReasons } from '@/admin/delivery-math'
import { getAccountById } from '@/db/accounts'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, jobs, mailEvents, sendRecipients, sends } from '@/db/schema'
import { contactsIncludingDeleted } from '@/db/live-contacts'

export type SendListRow = {
  id: string
  accountId: string
  accountName: string
  scheduledFor: Date
  state: string
  composed: number
  skipped: number
  sent: number
  failed: number
  bounced: number
  complained: number
}

async function requireAdmin(adminAccountId: string) {
  const admin = await getAccountById(adminAccountId)
  if (!admin || admin.role !== 'admin') return null
  return admin
}

export async function listSendsForAdmin(
  adminAccountId: string,
  filters: { accountId?: string; state?: string },
): Promise<SendListRow[]> {
  if (!(await requireAdmin(adminAccountId))) return []
  const { db } = getRuntimeDb()
  const rows = await db
    .select({
      id: sends.id,
      accountId: sends.accountId,
      accountName: accounts.name,
      scheduledFor: sends.scheduledFor,
      state: sends.state,
      composed: sends.composedCount,
      skipped: sends.skippedCount,
    })
    .from(sends)
    .innerJoin(accounts, eq(accounts.id, sends.accountId))
    .where(
      and(
        filters.accountId ? eq(sends.accountId, filters.accountId) : undefined,
        filters.state ? eq(sends.state, filters.state) : undefined,
      ),
    )
    .orderBy(desc(sends.scheduledFor))
    .limit(200)
  if (!rows.length) return []

  const ids = rows.map((row) => row.id)
  const recipients = await db
    .select({
      sendId: sendRecipients.sendId,
      email: contactsIncludingDeleted.email,
      sentAt: sendRecipients.sentAt,
      error: sendRecipients.error,
    })
    .from(sendRecipients)
    .innerJoin(contactsIncludingDeleted, eq(contactsIncludingDeleted.id, sendRecipients.contactId))
    .where(inArray(sendRecipients.sendId, ids))
  const emails = [...new Set(recipients.map((row) => row.email.toLowerCase()))]
  const events = emails.length
    ? await db
        .select({ email: mailEvents.email, kind: mailEvents.kind })
        .from(mailEvents)
        .where(
          and(
            inArray(mailEvents.kind, ['hard_bounce', 'spam_complaint']),
            sql`lower(${mailEvents.email}) in (${sql.join(
              emails.map((email) => sql`${email}`),
              sql`, `,
            )})`,
          ),
        )
    : []
  const bounced = new Set(
    events
      .filter((event) => event.kind === 'hard_bounce' && event.email)
      .map((event) => event.email!.toLowerCase()),
  )
  const complained = new Set(
    events
      .filter((event) => event.kind === 'spam_complaint' && event.email)
      .map((event) => event.email!.toLowerCase()),
  )

  return rows.map((row) => {
    const mine = recipients.filter((item) => item.sendId === row.id)
    return {
      ...row,
      sent: mine.filter((item) => item.sentAt).length,
      failed: mine.filter((item) => !item.sentAt && item.error).length,
      bounced: mine.filter((item) => item.sentAt && bounced.has(item.email.toLowerCase())).length,
      complained: mine.filter((item) => item.sentAt && complained.has(item.email.toLowerCase()))
        .length,
    }
  })
}

export type SendDetail = {
  id: string
  accountId: string
  accountName: string
  scheduledFor: Date
  state: string
  composedCount: number
  skippedCount: number
  sent: number
  failed: number
  attempts: number
  composed: {
    id: string
    name: string
    email: string
    subject: string
    html: string
    blocks: string[]
  }[]
  skipped: { reason: string; count: number }[]
  failedRows: {
    name: string
    email: string
    error: string
    attempts: number
    permanent: boolean
  }[]
}

export async function getSendForAdmin(
  adminAccountId: string,
  sendId: string,
): Promise<SendDetail | null> {
  if (!(await requireAdmin(adminAccountId))) return null
  const { db } = getRuntimeDb()
  const [send] = await db
    .select({
      id: sends.id,
      accountId: sends.accountId,
      accountName: accounts.name,
      scheduledFor: sends.scheduledFor,
      state: sends.state,
      composedCount: sends.composedCount,
      skippedCount: sends.skippedCount,
      skips: sends.skips,
    })
    .from(sends)
    .innerJoin(accounts, eq(accounts.id, sends.accountId))
    .where(eq(sends.id, sendId))
    .limit(1)
  if (!send) return null

  const recipients = await db
    .select({
      id: sendRecipients.id,
      name: contactsIncludingDeleted.name,
      email: contactsIncludingDeleted.email,
      subject: sendRecipients.subject,
      html: sendRecipients.html,
      error: sendRecipients.error,
      permanentFailure: sendRecipients.permanentFailure,
      sentAt: sendRecipients.sentAt,
    })
    .from(sendRecipients)
    .innerJoin(contactsIncludingDeleted, eq(contactsIncludingDeleted.id, sendRecipients.contactId))
    .where(eq(sendRecipients.sendId, sendId))
  const attemptRows = await db
    .select({ attempts: jobs.attempts })
    .from(jobs)
    .where(and(eq(jobs.kind, 'send'), sql`${jobs.payload}->>'sendId' = ${sendId}`))
  const attempts = attemptRows.reduce((max, row) => Math.max(max, row.attempts), 0)

  return {
    id: send.id,
    accountId: send.accountId,
    accountName: send.accountName,
    scheduledFor: send.scheduledFor,
    state: send.state,
    composedCount: send.composedCount,
    skippedCount: send.skippedCount,
    sent: recipients.filter((row) => row.sentAt).length,
    failed: recipients.filter((row) => !row.sentAt && row.error).length,
    attempts,
    composed: recipients.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      subject: row.subject ?? '',
      html: row.html ?? '',
      blocks: blocksInStoredHtml(row.html ?? ''),
    })),
    skipped: groupSkipReasons(send.skips),
    failedRows: recipients
      .filter((row) => !row.sentAt && row.error)
      .map((row) => ({
        name: row.name,
        email: row.email,
        error: row.error ?? '',
        attempts,
        permanent: row.permanentFailure,
      })),
  }
}
