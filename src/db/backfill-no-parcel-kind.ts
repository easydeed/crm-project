import { and, eq, inArray } from 'drizzle-orm'
import { contactsTable, liveContacts } from '@/db/live-contacts'
import type { ParcelDb } from '@/matching/candidates'
import { noParcelKindFor } from '@/matching/no-parcel-kind'

export async function backfillNoParcelKind(db: ParcelDb, contactIds?: string[]) {
  const rows = await db
    .select({
      id: liveContacts.id,
      status: liveContacts.status,
      addressRaw: liveContacts.addressRaw,
      noParcelKind: liveContacts.noParcelKind,
    })
    .from(liveContacts)
    .where(
      and(
        eq(liveContacts.status, 'no_parcel'),
        contactIds?.length ? inArray(liveContacts.id, contactIds) : undefined,
      ),
    )

  let updated = 0
  for (const row of rows) {
    const kind = noParcelKindFor(row.status, row.addressRaw)
    if (!kind || kind === row.noParcelKind) continue
    await db
      .update(contactsTable)
      .set({ noParcelKind: kind })
      .where(and(eq(contactsTable.id, row.id), eq(contactsTable.status, 'no_parcel')))
    updated += 1
  }
  return { total: rows.length, updated }
}
