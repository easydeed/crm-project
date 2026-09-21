import { eq } from 'drizzle-orm'
import { parcels } from '@/db/schema'
import { streetNameNorm } from '@/matching/normalize'
import type { ParcelDb } from '@/matching/candidates'

export async function backfillStreetNameNorm(db: ParcelDb) {
  const rows = await db
    .select({
      id: parcels.id,
      address: parcels.address,
      streetNameNorm: parcels.streetNameNorm,
    })
    .from(parcels)

  let updated = 0
  for (const row of rows) {
    const next = streetNameNorm(row.address)
    if (!next || next === row.streetNameNorm) continue
    await db
      .update(parcels)
      .set({ streetNameNorm: next })
      .where(eq(parcels.id, row.id))
    updated += 1
  }
  return { total: rows.length, updated }
}
