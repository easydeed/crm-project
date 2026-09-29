import { eq } from 'drizzle-orm'
import { parseOptionalMlsAgentId } from '@/config/account-fields'
import { getRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'
import { importContacts } from '@/import/import-contacts'
import type { ImportRow, ImportSummary } from '@/import/types'
import { getListingProvider } from '@/providers/current'
import type { ClosedListing } from '@/providers/types'
import { freshClosingSearch, saveClosingSearch } from '@/signup/search-cache'

export type ClosingsSearch =
  | { kind: 'malformed'; message: string }
  | { kind: 'found'; agentId: string; listings: ClosedListing[] }

/**
 * We know the house, not the person: a listing-side sale leaves the buyer at the address,
 * someone the agent may never have met. The agent renames them when they know who lives there.
 */
export function homeownerName(listing: Pick<ClosedListing, 'address'>) {
  return `Homeowner at ${listing.address}`
}

/** One closing as an import row. No email: the MLS does not supply one, and we never guess. */
export function closingToImportRow(listing: ClosedListing, line: number): ImportRow {
  return {
    line,
    name: homeownerName(listing),
    email: null,
    address: `${listing.address}, ${listing.city}, CA ${listing.zip}`,
    closeDate: listing.closeDate,
  }
}

/**
 * Looks up an agent's closings and saves the id to the account. An empty list is the usual
 * answer for a buyer's agent and is returned as found, not as an error. Only an id that
 * cannot be an MLS handle is refused, because the feed answers the same empty list for an
 * id it does not know.
 */
export async function searchClosings(accountId: string, raw: string, now = new Date()): Promise<ClosingsSearch> {
  const parsed = parseOptionalMlsAgentId(raw)
  if (!parsed.ok) return { kind: 'malformed', message: parsed.message }
  if (!parsed.mlsAgentId) return { kind: 'malformed', message: 'Enter your MLS agent ID.' }
  const agentId = parsed.mlsAgentId

  const { db } = getRuntimeDb()
  await db.update(accounts).set({ mlsAgentId: agentId }).where(eq(accounts.id, accountId))
  const listings = await getListingProvider(accountId).closedByAgent(agentId)
  await saveClosingSearch(accountId, agentId, listings, now)
  return { kind: 'found', agentId, listings }
}

/**
 * Imports the closings the agent left ticked, through the one import path. The list is read
 * again server-side, from this account's search if it is under 15 minutes old, otherwise from
 * the provider: the ids posted back only choose among the agent's own closings, so a forged or
 * stale id selects nothing.
 */
export async function importClosings(
  accountId: string,
  agentId: string,
  selectedMlsIds: string[],
  now = new Date(),
): Promise<ImportSummary | { error: string }> {
  const parsed = parseOptionalMlsAgentId(agentId)
  if (!parsed.ok || !parsed.mlsAgentId) return { error: 'Search for your closings first.' }
  const wanted = new Set(selectedMlsIds)
  const listings =
    (await freshClosingSearch(accountId, parsed.mlsAgentId, now)) ??
    (await getListingProvider(accountId).closedByAgent(parsed.mlsAgentId))
  const rows = listings
    .filter((listing) => wanted.has(listing.mlsId))
    .map((listing, index) => closingToImportRow(listing, index + 1))
  if (!rows.length) return { error: 'Tick at least one home to add.' }
  const { db } = getRuntimeDb()
  return importContacts(db, accountId, rows)
}
