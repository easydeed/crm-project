import { and, eq, lt } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { closingSearches } from '@/db/schema-signup'
import type { ClosedListing } from '@/providers/types'

/** How long a search stands in for the MLS when the agent imports from it. */
export const SEARCH_FRESH_MS = 15 * 60 * 1000
/** Anything older is deleted whenever a new search is written, so the table never only grows. */
export const SEARCH_KEEP_MS = 60 * 60 * 1000

export async function saveClosingSearch(accountId: string, agentId: string, listings: ClosedListing[], now = new Date()) {
  const { db } = getRuntimeDb()
  await db.delete(closingSearches).where(lt(closingSearches.createdAt, new Date(now.getTime() - SEARCH_KEEP_MS)))
  await db
    .insert(closingSearches)
    .values({ accountId, agentId, listings, createdAt: now })
    .onConflictDoUpdate({ target: closingSearches.accountId, set: { agentId, listings, createdAt: now } })
}

/** This account's search for this agent id, if made within the last 15 minutes. */
export async function freshClosingSearch(accountId: string, agentId: string, now = new Date()): Promise<ClosedListing[] | null> {
  const { db } = getRuntimeDb()
  const [row] = await db
    .select({ listings: closingSearches.listings, createdAt: closingSearches.createdAt })
    .from(closingSearches)
    .where(and(eq(closingSearches.accountId, accountId), eq(closingSearches.agentId, agentId)))
    .limit(1)
  if (!row || now.getTime() - row.createdAt.getTime() > SEARCH_FRESH_MS) return null
  return row.listings
}
