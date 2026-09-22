import { and, desc, eq, ne } from 'drizzle-orm'
import { CA_TAX } from '@/config/ca-tax'
import type { createDb } from '@/db/client'
import { accounts, contacts, parcelEvents, parcels } from '@/db/schema'
import { withinTrailingMonths } from '@/digest/format'
import { GRANT_DEED } from '@/digest/types'
import type { DigestEvent, DigestInput, DigestParcel } from '@/digest/types'

export type DigestDb = ReturnType<typeof createDb>['db']

export function firstNameFrom(name: string) {
  return name.trim().split(/\s+/)[0] || name.trim()
}

function asDay(value: string | Date | null | undefined): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value.slice(0, 10)
  return value.toISOString().slice(0, 10)
}

function asInt(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function asText(value: string | null | undefined): string | null {
  if (value == null || value === '') return null
  return String(value)
}

function toEvent(row: {
  kind: string
  docNumber: string
  recordedAt: string | Date
  amount: number | null
  party: string | null
  propertyType?: string | null
  address?: string | null
}): DigestEvent {
  return {
    kind: row.kind,
    docNumber: row.docNumber,
    recordedAt: asDay(row.recordedAt) ?? '',
    amount: asInt(row.amount),
    party: row.party,
    propertyType: asText(row.propertyType),
    address: asText(row.address),
  }
}

async function loadStreetSales(
  db: DigestDb,
  args: { parcelId: string; zip: string; streetNameNorm: string; asOf: Date },
): Promise<DigestEvent[]> {
  if (!args.streetNameNorm) return []
  const rows = await db
    .select({
      kind: parcelEvents.kind,
      docNumber: parcelEvents.docNumber,
      recordedAt: parcelEvents.recordedAt,
      amount: parcelEvents.amount,
      party: parcelEvents.party,
      propertyType: parcels.useCode,
      address: parcels.address,
    })
    .from(parcelEvents)
    .innerJoin(parcels, eq(parcels.id, parcelEvents.parcelId))
    .where(
      and(
        eq(parcels.zip, args.zip),
        eq(parcels.streetNameNorm, args.streetNameNorm),
        ne(parcels.id, args.parcelId),
        eq(parcelEvents.kind, GRANT_DEED),
      ),
    )
    .orderBy(desc(parcelEvents.recordedAt), desc(parcelEvents.docNumber))

  return rows
    .map((row) => toEvent(row))
    .filter((sale) => sale.recordedAt && withinTrailingMonths(sale.recordedAt, args.asOf, 12))
}

export async function buildDigestInput(
  db: DigestDb,
  accountId: string,
  contactId: string,
  asOf: Date,
): Promise<DigestInput | null> {
  const [row] = await db
    .select({
      name: contacts.name,
      closeDate: contacts.closeDate,
      parcelId: contacts.parcelId,
      agentName: accounts.name,
      brokerage: accounts.brokerage,
      dre: accounts.dre,
      phone: accounts.phone,
      senderName: accounts.senderName,
      replyTo: accounts.replyTo,
      accentColor: accounts.accentColor,
      address: parcels.address,
      city: parcels.city,
      zip: parcels.zip,
      streetNameNorm: parcels.streetNameNorm,
      beds: parcels.beds,
      baths: parcels.baths,
      sqft: parcels.sqft,
      useCode: parcels.useCode,
      assessedValue: parcels.assessedValue,
    })
    .from(contacts)
    .innerJoin(accounts, eq(accounts.id, contacts.accountId))
    .leftJoin(parcels, eq(parcels.id, contacts.parcelId))
    .where(and(eq(contacts.id, contactId), eq(contacts.accountId, accountId)))
    .limit(1)

  if (!row?.parcelId || !row.address || !row.city || !row.zip) return null

  const eventRows = await db
    .select({
      kind: parcelEvents.kind,
      docNumber: parcelEvents.docNumber,
      recordedAt: parcelEvents.recordedAt,
      amount: parcelEvents.amount,
      party: parcelEvents.party,
    })
    .from(parcelEvents)
    .where(eq(parcelEvents.parcelId, row.parcelId))
    .orderBy(desc(parcelEvents.recordedAt), desc(parcelEvents.docNumber))

  const parcel: DigestParcel = {
    address: row.address,
    city: row.city,
    zip: row.zip,
    beds: asInt(row.beds),
    baths: asText(row.baths),
    sqft: asInt(row.sqft),
    useCode: asText(row.useCode),
    assessedValue: asInt(row.assessedValue),
  }

  return {
    asOf,
    agent: {
      name: row.agentName,
      brokerage: row.brokerage,
      dre: row.dre,
      phone: row.phone,
      senderName: row.senderName,
      replyTo: row.replyTo,
      accentColor: row.accentColor,
    },
    contact: {
      firstName: firstNameFrom(row.name),
      closeDate: asDay(row.closeDate),
    },
    parcel,
    events: eventRows.map((event) => toEvent(event)),
    streetSales: await loadStreetSales(db, {
      parcelId: row.parcelId,
      zip: row.zip,
      streetNameNorm: row.streetNameNorm ?? '',
      asOf,
    }),
    nearbyListing: null,
    tax: CA_TAX,
  }
}
