import { eq } from 'drizzle-orm'
import type { DigestDb } from '@/digest/build-input'
import { mlsListings } from '@/db/schema'
import { nearbyHouse } from '@/matching/normalize'
import { withinTrailingDays } from '@/digest/format'

/** Use an actual listing on this street, never an arbitrary ZIP-wide comparable. */
export async function loadNearbyListing(db: DigestDb, home: { address: string; zip: string; useCode: string | null }, asOf: Date) {
  const rows = await db.select().from(mlsListings).where(eq(mlsListings.zip, home.zip))
  return rows.filter((row) =>
    row.status.toLowerCase() === 'active' && row.listDate &&
    withinTrailingDays(row.listDate, asOf, 90) &&
    nearbyHouse(row.address, home.address) &&
    (!home.useCode || !row.propertyType || home.useCode.toLowerCase() === row.propertyType.toLowerCase()),
  ).sort((a, b) => (b.listDate ?? '').localeCompare(a.listDate ?? '') || a.mlsId.localeCompare(b.mlsId))[0] ?? null
}
