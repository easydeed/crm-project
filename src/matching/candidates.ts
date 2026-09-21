import { and, eq, sql } from 'drizzle-orm'
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
const FUZZY_MIN = 0.2

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

function partitionFor(normalized: NormalizedAddress) {
  if (normalized.zip) return eq(parcels.zip, normalized.zip)
  if (normalized.city) return eq(parcels.city, normalized.city)
  return null
}

export async function findCandidateParcels(
  db: ParcelDb,
  normalized: NormalizedAddress,
): Promise<ParcelRecord[]> {
  const name = normalized.name
  const partition = partitionFor(normalized)
  if (!name || !partition) return []

  const score = sql<number>`greatest(
    case when ${parcels.streetNameNorm} = ${name} then 1 else 0 end,
    similarity(${parcels.streetNameNorm}, ${name})
  )`
  const numberMatch = normalized.number
    ? sql`case when ${parcels.address} ilike ${`${escapeLike(normalized.number)} %`} then 0 else 1 end`
    : sql`1`

  const rows = await db
    .select({ ...parcelCols, score })
    .from(parcels)
    .where(
      and(
        partition,
        sql`(
          ${parcels.streetNameNorm} = ${name}
          or ${parcels.streetNameNorm} % ${name}
          or similarity(${parcels.streetNameNorm}, ${name}) >= ${FUZZY_MIN}
        )`,
      ),
    )
    .orderBy(numberMatch, sql`${score} desc`, parcels.address)
    .limit(CANDIDATE_LIMIT)

  return rows.map((row) => ({
    id: row.id,
    apn: row.apn,
    county: row.county,
    address: row.address,
    city: row.city,
    zip: row.zip,
  }))
}
