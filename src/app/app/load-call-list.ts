import { and, desc, eq, inArray, ne, sql } from 'drizzle-orm'
import { callListNote } from '@/app/app/call-states'
import { callRecordLines } from '@/app/app/call-record'
import { callTag } from '@/app/app/call-tags'
import { isTimezone } from '@/config/settings'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, contacts, parcelEvents, parcels } from '@/db/schema'
import { callListEntries, callLog } from '@/db/schema-call-lists'
import { formatRecordedDay } from '@/digest/format'
import type { DigestEvent } from '@/digest/types'
import { localDate } from '@/jobs/schedule-time'

export type DashboardCall = {
  contactId: string
  name: string
  email: string
  phone: string | null
  address: string
  closeLabel: string
  tag: string
  detail: string
  outcome: 'called' | 'dismissed' | null
  recordLines: string[]
}

function asDay(value: string | Date | null) {
  if (value == null) return null
  if (typeof value === 'string') return value.slice(0, 10)
  return value.toISOString().slice(0, 10)
}

function periodFor(now: Date, timeZone: string) {
  const day = localDate(now, timeZone)
  return `${day.year}-${String(day.month).padStart(2, '0')}`
}

export async function loadDashboardCalls(accountId: string, now = new Date()) {
  const { db } = getRuntimeDb()
  const [account] = await db
    .select({
      sendDay: accounts.sendDay,
      timezone: accounts.timezone,
    })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1)
  const zone = account?.timezone && isTimezone(account.timezone) ? account.timezone : 'UTC'
  const period = periodFor(now, zone)

  const [matched] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contacts)
    .where(and(eq(contacts.accountId, accountId), eq(contacts.status, 'matched'), sql`${contacts.parcelId} is not null`))
  const [review] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contacts)
    .where(and(eq(contacts.accountId, accountId), ne(contacts.status, 'matched')))

  const rows = await db
    .select({
      contactId: callListEntries.contactId,
      kind: callListEntries.kind,
      detail: callListEntries.detail,
      name: contacts.name,
      email: contacts.email,
      phone: contacts.phone,
      addressRaw: contacts.addressRaw,
      closeDate: contacts.closeDate,
      parcelId: parcels.id,
      parcelAddress: parcels.address,
      city: parcels.city,
      zip: parcels.zip,
      outcome: callLog.outcome,
    })
    .from(callListEntries)
    .innerJoin(contacts, and(eq(contacts.id, callListEntries.contactId), eq(contacts.accountId, accountId)))
    .leftJoin(parcels, eq(parcels.id, contacts.parcelId))
    .leftJoin(
      callLog,
      and(eq(callLog.accountId, accountId), eq(callLog.contactId, callListEntries.contactId), eq(callLog.period, period)),
    )
    .where(and(eq(callListEntries.accountId, accountId), eq(callListEntries.period, period)))
    .orderBy(desc(callListEntries.score), contacts.name)

  const parcelIds = rows.map((row) => row.parcelId).filter((id): id is string => Boolean(id))
  const eventRows = parcelIds.length
    ? await db
        .select({
          parcelId: parcelEvents.parcelId,
          kind: parcelEvents.kind,
          docNumber: parcelEvents.docNumber,
          recordedAt: parcelEvents.recordedAt,
          amount: parcelEvents.amount,
          party: parcelEvents.party,
        })
        .from(parcelEvents)
        .where(inArray(parcelEvents.parcelId, parcelIds))
    : []
  const eventsByParcel = new Map<string, DigestEvent[]>()
  for (const event of eventRows) {
    const recordedAt = asDay(event.recordedAt)
    if (!recordedAt) continue
    const list = eventsByParcel.get(event.parcelId) ?? []
    list.push({
      kind: event.kind,
      docNumber: event.docNumber,
      recordedAt,
      amount: event.amount,
      party: event.party,
    })
    eventsByParcel.set(event.parcelId, list)
  }

  const entries: DashboardCall[] = rows.map((row) => {
    const closeDate = asDay(row.closeDate)
    const address =
      row.parcelAddress && row.city && row.zip
        ? `${row.parcelAddress}, ${row.city}, CA ${row.zip}`
        : row.addressRaw
    const outcome = row.outcome === 'called' || row.outcome === 'dismissed' ? row.outcome : null
    return {
      contactId: row.contactId,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address,
      closeLabel: closeDate ? `Closed ${formatRecordedDay(closeDate)}` : 'No close date on file',
      tag: callTag(row.kind),
      detail: row.detail,
      outcome,
      recordLines: callRecordLines(closeDate, row.parcelId ? (eventsByParcel.get(row.parcelId) ?? []) : []),
    }
  })

  const openCount = entries.filter((entry) => entry.outcome == null).length
  return {
    entries,
    note: callListNote({
      matchedCount: matched?.count ?? 0,
      entryCount: entries.length,
      openCount,
      sendDay: account?.sendDay ?? null,
      needsReview: (review?.count ?? 0) > 0,
    }),
  }
}

export async function listHomeownerSummary(accountId: string) {
  const { db } = getRuntimeDb()
  const rows = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      addressRaw: contacts.addressRaw,
      parcelAddress: parcels.address,
    })
    .from(contacts)
    .leftJoin(parcels, eq(parcels.id, contacts.parcelId))
    .where(eq(contacts.accountId, accountId))
    .orderBy(contacts.name)
    .limit(6)
  return {
    people: rows.slice(0, 5).map((row) => ({
      id: row.id,
      name: row.name,
      address: row.parcelAddress || row.addressRaw,
    })),
    more: rows.length > 5,
  }
}
