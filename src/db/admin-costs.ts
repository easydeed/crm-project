import { and, eq, gte, isNotNull, lt, sql } from 'drizzle-orm'
import { computeCosts, type CostReport } from '@/admin/cost-math'
import { COST_RATES, PLAN, type CostRates } from '@/config/costs'
import { getAccountById } from '@/db/accounts'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, sendRecipients, sends, subscriptions } from '@/db/schema'
import { providerCalls } from '@/db/schema-billing'
import { atLocalTime, localDate } from '@/jobs/schedule-time'

const BUSINESS_TZ = 'America/Los_Angeles'

/** This calendar month in Pacific time, as [start, end). */
export function monthWindow(now: Date) {
  const today = localDate(now, BUSINESS_TZ)
  const first = { year: today.year, month: today.month, day: 1 }
  const next = today.month === 12 ? { year: today.year + 1, month: 1, day: 1 } : { year: today.year, month: today.month + 1, day: 1 }
  return { start: atLocalTime(first, '00:00', BUSINESS_TZ), end: atLocalTime(next, '00:00', BUSINESS_TZ) }
}

export async function loadCostsForAdmin(adminAccountId: string, now = new Date(), rates: CostRates = COST_RATES): Promise<CostReport | null> {
  const admin = await getAccountById(adminAccountId)
  if (!admin || admin.role !== 'admin') return null
  const { db } = getRuntimeDb()
  const { start, end } = monthWindow(now)

  const agentRows = await db
    .select({ id: accounts.id, name: accounts.name, email: accounts.email, status: subscriptions.status })
    .from(accounts)
    .leftJoin(subscriptions, eq(subscriptions.accountId, accounts.id))
    .where(eq(accounts.role, 'agent'))

  const calls = await db
    .select({
      accountId: providerCalls.accountId,
      provider: providerCalls.provider,
      count: sql<number>`sum(${providerCalls.count})::int`,
      costCents: sql<number>`coalesce(sum(${providerCalls.costCents}), 0)::float8`,
      unpricedCount: sql<number>`coalesce(sum(${providerCalls.count}) filter (where ${providerCalls.costCents} is null), 0)::int`,
    })
    .from(providerCalls)
    .where(and(gte(providerCalls.createdAt, start), lt(providerCalls.createdAt, end)))
    .groupBy(providerCalls.accountId, providerCalls.provider)

  // Includes deleted contacts: a delivered email cost money whoever it went to.
  const sent = await db
    .select({ accountId: sends.accountId, count: sql<number>`count(*)::int` })
    .from(sendRecipients)
    .innerJoin(sends, eq(sends.id, sendRecipients.sendId))
    .where(and(isNotNull(sendRecipients.sentAt), gte(sendRecipients.sentAt, start), lt(sendRecipients.sentAt, end)))
    .groupBy(sends.accountId)

  return computeCosts(
    {
      accounts: agentRows.map((row) => ({ id: row.id, name: row.name, email: row.email, active: row.status === 'active' })),
      providerCalls: calls,
      sends: sent,
    },
    rates,
    PLAN.priceCents,
  )
}
