import { and, eq, inArray, sql } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, contactSubscriptions, contacts, mailEvents, parcels } from '@/db/schema'
import { addressStops, stopsState } from '@/suppression/lift'
import { readUnsubscribeToken, type UnsubscribeScope } from '@/unsubscribe/token'

export type ScopeRow = { scope: UnsubscribeScope; active: boolean }

export type UnsubscribeView = {
  contactId: string
  scope: UnsubscribeScope
  propertyAddress: string
  addressRaw: string
  agentName: string
  scopes: ScopeRow[]
  blocked: boolean
  /** This address is on the suppression list for this scope. */
  suppressed: boolean
  /** Every stop on this address is the homeowner's own unsubscribe, so they may undo it. */
  reversible: boolean
  notice: string | null
}

function formatParcel(address: string | null, city: string | null, zip: string | null) {
  return [address, city, zip].filter(Boolean).join(', ')
}

export async function loadUnsubscribeView(token: string): Promise<UnsubscribeView | null> {
  const parsed = readUnsubscribeToken(token)
  if (!parsed) return null
  const { db } = getRuntimeDb()
  const [row] = await db
    .select({
      id: contacts.id,
      email: contacts.email,
      addressRaw: contacts.addressRaw,
      agentName: accounts.name,
      parcelAddress: parcels.address,
      parcelCity: parcels.city,
      parcelZip: parcels.zip,
    })
    .from(contacts)
    .innerJoin(accounts, eq(accounts.id, contacts.accountId))
    .leftJoin(parcels, eq(parcels.id, contacts.parcelId))
    .where(eq(contacts.id, parsed.contactId))
    .limit(1)
  if (!row) return null

  const subs = await db
    .select({
      scope: contactSubscriptions.scope,
      unsubscribedAt: contactSubscriptions.unsubscribedAt,
    })
    .from(contactSubscriptions)
    .where(eq(contactSubscriptions.contactId, row.id))

  const [blocked] = await db
    .select({ kind: mailEvents.kind })
    .from(mailEvents)
    .where(
      and(
        sql`lower(${mailEvents.email}) = ${row.email.toLowerCase()}`,
        inArray(mailEvents.kind, ['hard_bounce', 'spam_complaint']),
      ),
    )
    .limit(1)

  const state = stopsState(await addressStops(db, row.email), parsed.scope)

  const scopes: ScopeRow[] = subs
    .filter((sub) => sub.scope === 'monthly' || sub.scope === 'weekly')
    .map((sub) => ({
      scope: sub.scope,
      active: sub.unsubscribedAt == null,
    }))

  return {
    contactId: row.id,
    scope: parsed.scope,
    propertyAddress: formatParcel(row.parcelAddress, row.parcelCity, row.parcelZip) || row.addressRaw,
    addressRaw: row.addressRaw,
    agentName: row.agentName,
    scopes,
    blocked: Boolean(blocked) || state.blocked,
    suppressed: state.suppressed,
    reversible: state.reversible,
    notice: null,
  }
}
