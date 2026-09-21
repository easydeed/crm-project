import { inArray } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { parcelEvents } from '@/db/schema'

export const GRANT_DEED_KIND = 'grant_deed'

export type OwnerEvent = {
  parcelId: string
  kind: string
  party: string | null
  recordedAt: string
  docNumber: string
}

export function pickRecordedOwners(events: OwnerEvent[]): Map<string, string> {
  const latest = new Map<string, OwnerEvent>()
  for (const event of events) {
    if (event.kind !== GRANT_DEED_KIND) continue
    const party = event.party?.trim()
    if (!party) continue
    const current = latest.get(event.parcelId)
    const newer =
      !current ||
      event.recordedAt > current.recordedAt ||
      (event.recordedAt === current.recordedAt && event.docNumber > current.docNumber)
    if (newer) latest.set(event.parcelId, { ...event, party })
  }
  return new Map(
    [...latest.entries()].map(([parcelId, event]) => [parcelId, event.party!.trim()]),
  )
}

export async function recordedOwnersForParcels(parcelIds: string[]) {
  if (!parcelIds.length) return new Map<string, string>()
  const { db } = getRuntimeDb()
  const rows = await db
    .select({
      parcelId: parcelEvents.parcelId,
      kind: parcelEvents.kind,
      party: parcelEvents.party,
      recordedAt: parcelEvents.recordedAt,
      docNumber: parcelEvents.docNumber,
    })
    .from(parcelEvents)
    .where(inArray(parcelEvents.parcelId, parcelIds))
  return pickRecordedOwners(rows)
}
