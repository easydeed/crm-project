import { and, eq, inArray } from 'drizzle-orm'
import { contacts } from '@/db/schema'
import type { ParcelDb } from '@/matching/candidates'
import { noParcelKindFor } from '@/matching/no-parcel-kind'

export async function backfillNoParcelKind(db: ParcelDb, contactIds?: string[]) {
  const rows = await db
    .select({
      id: contacts.id,
      status: contacts.status,
      addressRaw: contacts.addressRaw,
      noParcelKind: contacts.noParcelKind,
    })
    .from(contacts)
    .where(
      and(
        eq(contacts.status, 'no_parcel'),
        contactIds?.length ? inArray(contacts.id, contactIds) : undefined,
      ),
    )

  let updated = 0
  for (const row of rows) {
    const kind = noParcelKindFor(row.status, row.addressRaw)
    if (!kind || kind === row.noParcelKind) continue
    await db
      .update(contacts)
      .set({ noParcelKind: kind })
      .where(and(eq(contacts.id, row.id), eq(contacts.status, 'no_parcel')))
    updated += 1
  }
  return { total: rows.length, updated }
}
