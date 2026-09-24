import { and, asc, eq, inArray } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { contactMatchCandidates, contactSubscriptions, groupMembers, groups, parcels } from '@/db/schema'
import { liveContacts } from '@/db/live-contacts'
import {
  contactStatusLabel,
  type ContactMatchStatus,
} from '@/people/status'

export type ContactListStatus = ContactMatchStatus
export { contactStatusLabel }

export type ContactListRow = {
  id: string
  name: string
  email: string
  phone: string | null
  addressRaw: string
  closeDate: string | null
  notes: string | null
  status: ContactListStatus
  reviewState: 'pending' | 'reviewed'
  parcelId: string | null
  parcelAddress: string | null
  parcelApn: string | null
  unsubscribed: boolean
  homeownerAddressAt: Date | null
  groupIds: string[]
  groupNames: string[]
  candidates: Array<{
    parcelId: string
    confidence: number
    reason: string
    rank: number
  }>
}

type ListedRow = {
  id: string
  name: string
  email: string
  phone: string | null
  addressRaw: string
  closeDate: string | null
  notes: string | null
  status: ContactListStatus
  reviewState: 'pending' | 'reviewed'
  parcelId: string | null
  parcelStreet: string | null
  parcelCity: string | null
  parcelZip: string | null
  parcelApn: string | null
  homeownerAddressAt: Date | null
}

const listColumns = {
  id: liveContacts.id,
  name: liveContacts.name,
  email: liveContacts.email,
  phone: liveContacts.phone,
  addressRaw: liveContacts.addressRaw,
  closeDate: liveContacts.closeDate,
  notes: liveContacts.notes,
  status: liveContacts.status,
  reviewState: liveContacts.reviewState,
  parcelId: liveContacts.parcelId,
  parcelStreet: parcels.address,
  parcelCity: parcels.city,
  parcelZip: parcels.zip,
  parcelApn: parcels.apn,
  homeownerAddressAt: liveContacts.homeownerAddressAt,
}

function formatParcelAddress(row: ListedRow) {
  if (!row.parcelStreet) return null
  return [row.parcelStreet, row.parcelCity, row.parcelZip].filter(Boolean).join(', ')
}

export async function listContactsForAccount(
  accountId: string,
  filters?: { status?: ContactListStatus },
): Promise<ContactListRow[]> {
  const { db } = getRuntimeDb()
  const rows = await db
    .select(listColumns)
    .from(liveContacts)
    .leftJoin(parcels, eq(liveContacts.parcelId, parcels.id))
    .where(
      filters?.status
        ? and(eq(liveContacts.accountId, accountId), eq(liveContacts.status, filters.status))
        : eq(liveContacts.accountId, accountId),
    )
    .orderBy(asc(liveContacts.name))

  return hydrateContacts(accountId, rows)
}

export async function getContactForAccount(
  accountId: string,
  contactId: string,
): Promise<ContactListRow | null> {
  const { db } = getRuntimeDb()
  const rows = await db
    .select(listColumns)
    .from(liveContacts)
    .leftJoin(parcels, eq(liveContacts.parcelId, parcels.id))
    .where(and(eq(liveContacts.accountId, accountId), eq(liveContacts.id, contactId)))
    .limit(1)
  const [row] = await hydrateContacts(accountId, rows)
  return row ?? null
}

async function hydrateContacts(accountId: string, rows: ListedRow[]) {
  const { db } = getRuntimeDb()
  const ids = rows.map((row) => row.id)
  const memberships = ids.length
    ? await db
        .select({
          contactId: groupMembers.contactId,
          groupId: groups.id,
          groupName: groups.name,
        })
        .from(groupMembers)
        .innerJoin(groups, eq(groupMembers.groupId, groups.id))
        .where(and(eq(groups.accountId, accountId), inArray(groupMembers.contactId, ids)))
    : []
  const reviewIds = rows
    .filter((row) => row.status === 'needs_review')
    .map((row) => row.id)
  const candidates = reviewIds.length
    ? await db
        .select({
          contactId: contactMatchCandidates.contactId,
          parcelId: contactMatchCandidates.parcelId,
          confidence: contactMatchCandidates.confidence,
          reason: contactMatchCandidates.reason,
          rank: contactMatchCandidates.rank,
        })
        .from(contactMatchCandidates)
        .where(inArray(contactMatchCandidates.contactId, reviewIds))
    : []
  const subs = ids.length
    ? await db
        .select({
          contactId: contactSubscriptions.contactId,
          unsubscribedAt: contactSubscriptions.unsubscribedAt,
        })
        .from(contactSubscriptions)
        .where(
          and(
            eq(contactSubscriptions.scope, 'monthly'),
            inArray(contactSubscriptions.contactId, ids),
          ),
        )
    : []

  return rows.map((row) => {
    const groupRows = memberships.filter((item) => item.contactId === row.id)
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      addressRaw: row.addressRaw,
      closeDate: row.closeDate,
      notes: row.notes,
      status: row.status,
      reviewState: row.reviewState,
      parcelId: row.parcelId,
      parcelAddress: formatParcelAddress(row),
      parcelApn: row.parcelApn,
      unsubscribed: subs.some(
        (sub) => sub.contactId === row.id && sub.unsubscribedAt != null,
      ),
      homeownerAddressAt: row.homeownerAddressAt,
      groupIds: groupRows.map((item) => item.groupId),
      groupNames: groupRows.map((item) => item.groupName),
      candidates: candidates
        .filter((candidate) => candidate.contactId === row.id)
        .sort((left, right) => left.rank - right.rank)
        .map(({ parcelId, confidence, reason, rank }) => ({
          parcelId,
          confidence,
          reason,
          rank,
        })),
    }
  })
}
