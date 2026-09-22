import { and, eq, inArray } from 'drizzle-orm'
import { persistContactCandidates } from '@/db/persist-contact-candidates'
import { getRuntimeDb } from '@/db/runtime'
import { contacts } from '@/db/schema'
import { resolveAddressMatch } from '@/matching/resolve-match'

export type ContactWriteInput = {
  name: string
  email: string
  phone: string | null
  addressRaw: string
  closeDate: string | null
  notes: string | null
}

export async function updateContactForAccount(
  accountId: string,
  contactId: string,
  input: ContactWriteInput,
): Promise<{ ok: true; rematched: boolean } | { ok: false; error: string }> {
  const { db } = getRuntimeDb()
  const [existing] = await db
    .select({
      id: contacts.id,
      addressRaw: contacts.addressRaw,
    })
    .from(contacts)
    .where(and(eq(contacts.id, contactId), eq(contacts.accountId, accountId)))
    .limit(1)
  if (!existing) return { ok: false, error: 'We could not find that person.' }

  const rematch = existing.addressRaw.trim() !== input.addressRaw.trim()
  const match = rematch ? await resolveAddressMatch(db, input.addressRaw) : null

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(contacts)
        .set({
          name: input.name,
          email: input.email,
          phone: input.phone,
          addressRaw: input.addressRaw,
          closeDate: input.closeDate,
          notes: input.notes,
          ...(match
            ? {
                status: match.status,
                parcelId: match.parcelId,
                reviewState: 'pending' as const,
                matchSource: 'auto' as const,
                noParcelKind: match.noParcelKind,
              }
            : {}),
        })
        .where(and(eq(contacts.id, contactId), eq(contacts.accountId, accountId)))
      if (match) {
        await persistContactCandidates(tx, contactId, match.candidates, 'replace')
      }
    })
  } catch (error) {
    const code =
      typeof error === 'object' && error && 'code' in error ? error.code : null
    if (code === '23505') return { ok: false, error: 'Already in your list' }
    throw error
  }

  return { ok: true, rematched: Boolean(match) }
}

export async function deleteContactsForAccount(
  accountId: string,
  contactIds: string[],
) {
  if (!contactIds.length) return 0
  const { db } = getRuntimeDb()
  const deleted = await db
    .delete(contacts)
    .where(and(eq(contacts.accountId, accountId), inArray(contacts.id, contactIds)))
    .returning({ id: contacts.id })
  return deleted.length
}
