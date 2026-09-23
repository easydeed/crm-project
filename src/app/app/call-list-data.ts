import { and, eq, sql } from 'drizzle-orm'
import { toCallList, type CallList } from '@/app/app/call-list-view'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, contacts, parcels } from '@/db/schema'
import { callListEntries } from '@/db/schema-call-lists'
import { callListPeriod } from '@/jobs/call-list-period'

/** Reads this month's stored call list. The pause does not hide it. */
export async function loadCallList(accountId: string, now = new Date()): Promise<CallList> {
  const { db } = getRuntimeDb()
  const [account] = await db
    .select({ timezone: accounts.timezone })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1)
  const period = callListPeriod(now, account?.timezone ?? null)

  const [counts] = await db
    .select({
      people: sql<number>`count(*)::int`,
      matched: sql<number>`count(*) filter (where ${contacts.status} = 'matched')::int`,
    })
    .from(contacts)
    .where(eq(contacts.accountId, accountId))

  const rows = await db
    .select({
      contactId: callListEntries.contactId,
      name: contacts.name,
      kind: callListEntries.kind,
      detail: callListEntries.detail,
      score: callListEntries.score,
      address: parcels.address,
      closeDate: contacts.closeDate,
    })
    .from(callListEntries)
    .innerJoin(contacts, eq(contacts.id, callListEntries.contactId))
    .leftJoin(parcels, eq(parcels.id, contacts.parcelId))
    .where(and(eq(callListEntries.accountId, accountId), eq(callListEntries.period, period)))

  return toCallList({
    people: counts?.people ?? 0,
    matched: counts?.matched ?? 0,
    rows: rows.map((row) => ({ ...row, closeDate: row.closeDate == null ? null : String(row.closeDate) })),
  })
}
