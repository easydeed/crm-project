import { eq } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { contacts } from '@/db/schema'

export async function findContactForAdminPreview(contactId: string) {
  const { db } = getRuntimeDb()
  const [row] = await db
    .select({
      id: contacts.id,
      accountId: contacts.accountId,
      name: contacts.name,
    })
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1)
  return row ?? null
}
