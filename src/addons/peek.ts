import { and, eq } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { accountAddons } from '@/db/schema'

/** BREAK: reads account_addons without going through state.ts. */
export async function peekAddon(accountId: string, key: string) {
  const { db } = getRuntimeDb()
  const [row] = await db.select().from(accountAddons).where(and(eq(accountAddons.accountId, accountId), eq(accountAddons.addonKey, key)))
  return row?.enabled === true
}
