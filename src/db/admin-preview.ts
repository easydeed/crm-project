import { eq } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { liveContacts } from '@/db/live-contacts'

export async function findContactForAdminPreview(contactId: string) {
  const { db } = getRuntimeDb()
  const [row] = await db
    .select({
      id: liveContacts.id,
      accountId: liveContacts.accountId,
      name: liveContacts.name,
    })
    .from(liveContacts)
    .where(eq(liveContacts.id, contactId))
    .limit(1)
  return row ?? null
}
