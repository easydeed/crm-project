import { and, asc, eq, inArray } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import {
  contactMatchCandidates,
  contacts,
  groupMembers,
  groups,
  parcels,
} from '@/db/schema'
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
  parcelId: string | null
  parcelAddress: string | null
  parcelApn: string | null
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
  parcelId: string | null
  parcelStreet: string | null
  parcelCity: string | null
  parcelZip: string | null
  parcelApn: string | null
}

const listColumns = {
  id: contacts.id,
  name: contacts.name,
  email: contacts.email,
  phone: contacts.phone,
  addressRaw: contacts.addressRaw,
  closeDate: contacts.closeDate,
  notes: contacts.notes,
  status: contacts.status,
  parcelId: contacts.parcelId,
  parcelStreet: parcels.address,
  parcelCity: parcels.city,
  parcelZip: parcels.zip,
  parcelApn: parcels.apn,
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
    .from(contacts)
    .leftJoin(parcels, eq(contacts.parcelId, parcels.id))
    .where(
      filters?.status
        ? and(eq(contacts.accountId, accountId), eq(contacts.status, filters.status))
        : eq(contacts.accountId, accountId),
    )
    .orderBy(asc(contacts.name))

  return hydrateContacts(accountId, rows)
}

export async function getContactForAccount(
  accountId: string,
  contactId: string,
): Promise<ContactListRow | null> {
  const { db } = getRuntimeDb()
  const rows = await db
    .select(listColumns)
    .from(contacts)
    .leftJoin(parcels, eq(contacts.parcelId, parcels.id))
    .where(and(eq(contacts.accountId, accountId), eq(contacts.id, contactId)))
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
      parcelId: row.parcelId,
      parcelAddress: formatParcelAddress(row),
      parcelApn: row.parcelApn,
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
