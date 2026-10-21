import { eq, sql } from 'drizzle-orm'
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
  const query = candidateQuery(normalized)
  if (!query) return []
  return db.execute<ParcelRecord>(query)
}

/** Shared with EXPLAIN tests so the budget measures the query users run. */
export function candidateQuery(normalized: NormalizedAddress) {
  const name = normalized.name
  const partition = partitionFor(normalized)
  if (!name || !partition) return null

  const score = sql<number>`greatest(
    case when ${parcels.streetNameNorm} = ${name} then 1 else 0 end,
    similarity(${parcels.streetNameNorm}, ${name})
  )`
  const numberMatch = normalized.number
    ? sql`case when ${parcels.address} ilike ${`${escapeLike(normalized.number)} %`} then 0 else 1 end`
    : sql`1`

  // A ZIP may hold thousands of houses on the same streets. Materialize names
  // before fuzzy comparison, preserving the low-similarity typo fallback.
  return sql`
    with street_names as materialized (
      select distinct ${parcels.streetNameNorm} as name from ${parcels} where ${partition}
    ), matching_names as materialized (
      select name from street_names where name = ${name}
        or name % ${name} or similarity(name, ${name}) >= ${FUZZY_MIN}
    )
    select ${parcels.id} as id, ${parcels.apn} as apn, ${parcels.county} as county,
      ${parcels.address} as address, ${parcels.city} as city, ${parcels.zip} as zip
    from ${parcels}
    where ${partition} and ${parcels.streetNameNorm} in (select name from matching_names)
    order by ${numberMatch}, ${score} desc, ${parcels.address}
    limit ${CANDIDATE_LIMIT}
  `
}
