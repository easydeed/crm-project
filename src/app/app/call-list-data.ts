import { and, eq, sql } from 'drizzle-orm'
import { toCallList, type CallList, type CallPanel } from '@/app/app/call-list-view'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, contacts, parcels } from '@/db/schema'
import { callListEntries, callLog } from '@/db/schema-call-lists'
import { renderLoan } from '@/digest/blocks/loan'
import { renderRecord } from '@/digest/blocks/record'
import { buildDigestInput } from '@/digest/build-input'
import { callListPeriod } from '@/jobs/call-list-period'

type Db = ReturnType<typeof getRuntimeDb>['db']

function lines(block: { text: string } | null) {
  return block ? block.text.split('\n').filter(Boolean) : []
}

/** The same record and loan blocks the monthly note renders, as plain lines. */
async function recordFor(db: Db, accountId: string, contactId: string, now: Date) {
  const input = await buildDigestInput(db, accountId, contactId, now)
  if (!input) return { record: [], loan: [] }
  return {
    record: lines(renderRecord(input.parcel, input.events, input.asOf)),
    loan: lines(renderLoan(input.events)),
  }
}

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
      email: contacts.email,
      phone: contacts.phone,
      kind: callListEntries.kind,
      detail: callListEntries.detail,
      score: callListEntries.score,
      address: parcels.address,
      closeDate: contacts.closeDate,
      outcome: callLog.outcome,
    })
    .from(callListEntries)
    .innerJoin(contacts, eq(contacts.id, callListEntries.contactId))
    .leftJoin(parcels, eq(parcels.id, contacts.parcelId))
    .leftJoin(
      callLog,
      and(
        eq(callLog.accountId, callListEntries.accountId),
        eq(callLog.contactId, callListEntries.contactId),
        eq(callLog.period, callListEntries.period),
      ),
    )
    .where(and(eq(callListEntries.accountId, accountId), eq(callListEntries.period, period)))

  const shaped = []
  for (const row of rows) {
    const panel: CallPanel | undefined =
      row.outcome === 'dismissed'
        ? undefined
        : { phone: row.phone, email: row.email, ...(await recordFor(db, accountId, row.contactId, now)) }
    shaped.push({
      ...row,
      closeDate: row.closeDate == null ? null : String(row.closeDate),
      panel,
    })
  }

  return toCallList({ people: counts?.people ?? 0, matched: counts?.matched ?? 0, rows: shaped })
}
