import { and, eq, inArray } from 'drizzle-orm'
import type { createDb } from '@/db/client'
import { contactSubscriptions, contacts, parcelEvents, parcels } from '@/db/schema'
import { callListEntries, callLog } from '@/db/schema-call-lists'
import { GRANT_DEED } from '@/digest/types'
import { mergeShown } from '@/signals/shown'
import type { SignalContact, SignalEvent, StreetSale } from '@/signals/types'

type Db = ReturnType<typeof createDb>['db']

function asDay(value: string | Date | null | undefined) {
  if (value == null) return null
  if (typeof value === 'string') return value.slice(0, 10)
  return value.toISOString().slice(0, 10)
}

function asInt(value: number | string | null | undefined) {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export async function loadCallListInput(db: Db, accountId: string, asOf: Date) {
  const people = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      status: contacts.status,
      closeDate: contacts.closeDate,
      parcelId: parcels.id,
      address: parcels.address,
      zip: parcels.zip,
      streetNameNorm: parcels.streetNameNorm,
      useCode: parcels.useCode,
      assessedValue: parcels.assessedValue,
      subContactId: contactSubscriptions.contactId,
      unsubscribedAt: contactSubscriptions.unsubscribedAt,
    })
    .from(contacts)
    .leftJoin(parcels, eq(parcels.id, contacts.parcelId))
    .leftJoin(
      contactSubscriptions,
      and(
        eq(contactSubscriptions.contactId, contacts.id),
        eq(contactSubscriptions.scope, 'monthly'),
      ),
    )
    .where(eq(contacts.accountId, accountId))

  const parcelIds = people.map((row) => row.parcelId).filter((id): id is string => Boolean(id))
  const events = parcelIds.length
    ? await db
        .select({
          parcelId: parcelEvents.parcelId,
          kind: parcelEvents.kind,
          docNumber: parcelEvents.docNumber,
          recordedAt: parcelEvents.recordedAt,
          amount: parcelEvents.amount,
        })
        .from(parcelEvents)
        .where(inArray(parcelEvents.parcelId, parcelIds))
    : []

  const streets = [
    ...new Set(people.map((row) => row.streetNameNorm).filter((name): name is string => Boolean(name))),
  ]
  const zips = [...new Set(people.map((row) => row.zip).filter((zip): zip is string => Boolean(zip)))]
  const saleRows =
    streets.length && zips.length
      ? await db
          .select({
            parcelId: parcels.id,
            address: parcels.address,
            zip: parcels.zip,
            streetNameNorm: parcels.streetNameNorm,
            useCode: parcels.useCode,
            recordedAt: parcelEvents.recordedAt,
            amount: parcelEvents.amount,
            docNumber: parcelEvents.docNumber,
            kind: parcelEvents.kind,
          })
          .from(parcelEvents)
          .innerJoin(parcels, eq(parcels.id, parcelEvents.parcelId))
          .where(and(eq(parcelEvents.kind, GRANT_DEED), inArray(parcels.zip, zips), inArray(parcels.streetNameNorm, streets)))
      : []

  const priors = await db
    .select({ contactId: callListEntries.contactId, period: callListEntries.period })
    .from(callListEntries)
    .where(eq(callListEntries.accountId, accountId))
  const logged = await db
    .select({ contactId: callLog.contactId, period: callLog.period })
    .from(callLog)
    .where(eq(callLog.accountId, accountId))

  const eventsByParcel = new Map<string, SignalEvent[]>()
  for (const event of events) {
    const recordedAt = asDay(event.recordedAt)
    if (!recordedAt) continue
    const list = eventsByParcel.get(event.parcelId) ?? []
    list.push({
      kind: event.kind,
      docNumber: event.docNumber,
      recordedAt,
      amount: asInt(event.amount),
    })
    eventsByParcel.set(event.parcelId, list)
  }

  const contactsOut: SignalContact[] = people.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    subscribed: row.subContactId != null && row.unsubscribedAt == null,
    closeDate: asDay(row.closeDate),
    parcel:
      row.parcelId && row.address && row.zip
        ? {
            id: row.parcelId,
            address: row.address,
            zip: row.zip,
            streetNameNorm: row.streetNameNorm ?? '',
            useCode: row.useCode,
            assessedValue: asInt(row.assessedValue),
          }
        : null,
    events: row.parcelId ? (eventsByParcel.get(row.parcelId) ?? []) : [],
  }))

  const streetSales: StreetSale[] = saleRows.flatMap((row) => {
    const recordedAt = asDay(row.recordedAt)
    if (!recordedAt || !row.address || !row.zip) return []
    return [
      {
        parcelId: row.parcelId,
        address: row.address,
        zip: row.zip,
        streetNameNorm: row.streetNameNorm ?? '',
        useCode: row.useCode,
        recordedAt,
        amount: asInt(row.amount),
        docNumber: row.docNumber,
      },
    ]
  })

  return { asOf, contacts: contactsOut, streetSales, priorCalls: mergeShown(priors, logged) }
}
