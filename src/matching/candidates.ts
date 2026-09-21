import { and, eq, ilike } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '@/db/schema'
import { parcels } from '@/db/schema'
import type { NormalizedAddress } from '@/matching/types'

export type ParcelDb = PostgresJsDatabase<typeof schema>

export type ParcelRecord = {
  id: string
  apn: string
  county: string
  address: string
  city: string
  zip: string
}

const CANDIDATE_LIMIT = 50

const parcelCols = {
  id: parcels.id,
  apn: parcels.apn,
  county: parcels.county,
  address: parcels.address,
  city: parcels.city,
  zip: parcels.zip,
}

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

export async function findCandidateParcels(
  db: ParcelDb,
  normalized: NormalizedAddress,
): Promise<ParcelRecord[]> {
  if (normalized.zip) {
    return db
      .select(parcelCols)
      .from(parcels)
      .where(eq(parcels.zip, normalized.zip))
      .limit(CANDIDATE_LIMIT)
  }

  if (!normalized.city) return []

  const street = normalized.name
    ? ilike(parcels.address, `%${escapeLike(normalized.name)}%`)
    : undefined

  return db
    .select(parcelCols)
    .from(parcels)
    .where(
      street ? and(eq(parcels.city, normalized.city), street) : eq(parcels.city, normalized.city),
    )
    .limit(CANDIDATE_LIMIT)
}
