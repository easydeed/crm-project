import { asc, eq, inArray } from 'drizzle-orm'
import {
  compareAccountRates,
  matchingRates,
  type MatchingRate,
} from '@/admin/matching-rates'
import {
  howResolvedLabel,
  isMatchingFailure,
  matcherReturnedLabel,
  type FailureStatusFilter,
} from '@/admin/matching-labels'
import { getAccountById } from '@/db/accounts'
import { getRuntimeDb } from '@/db/runtime'
import type { ContactMatchSource } from '@/db/review-types'
import { accounts, contactMatchCandidates, parcels } from '@/db/schema'
import { liveContacts } from '@/db/live-contacts'
import type { NoParcelKind } from '@/matching/no-parcel-kind'
import type { ContactMatchStatus } from '@/people/status'

export type AccountMatchingRate = MatchingRate & {
  accountId: string
  accountName: string
}

export type MatchingFailureRow = {
  contactId: string
  accountId: string
  accountName: string
  addressRaw: string
  status: ContactMatchStatus
  matchSource: ContactMatchSource
  noParcelKind: NoParcelKind | null
  reviewState: 'pending' | 'reviewed'
  parcelApn: string | null
  matcherReturned: string
  howResolved: string
  candidates: Array<{ label: string; confidence: number }>
}

async function requireAdmin(adminAccountId: string) {
  const admin = await getAccountById(adminAccountId)
  if (!admin || admin.role !== 'admin') return null
  return admin
}

export async function listMatchingOverviewForAdmin(adminAccountId: string) {
  if (!(await requireAdmin(adminAccountId))) {
    return { overall: matchingRates([]), accounts: [] as AccountMatchingRate[] }
  }
  const { db } = getRuntimeDb()
  const rows = await db
    .select({
      accountId: liveContacts.accountId,
      accountName: accounts.name,
      status: liveContacts.status,
      matchSource: liveContacts.matchSource,
      noParcelKind: liveContacts.noParcelKind,
    })
    .from(liveContacts)
    .innerJoin(accounts, eq(accounts.id, liveContacts.accountId))
  const overall = matchingRates(rows)
  const byAccount = new Map<string, typeof rows>()
  for (const row of rows) {
    const list = byAccount.get(row.accountId) ?? []
    list.push(row)
    byAccount.set(row.accountId, list)
  }
  const accountRates = [...byAccount.entries()]
    .map(([accountId, list]) => ({
      accountId,
      accountName: list[0]?.accountName ?? accountId,
      ...matchingRates(list),
    }))
    .filter((row) => row.street > 0)
    .sort((left, right) => {
      const byRate = compareAccountRates(left, right)
      if (byRate !== 0) return byRate
      return left.accountName.localeCompare(right.accountName)
    })
  return { overall, accounts: accountRates }
}

export async function listMatchingFailuresForAdmin(
  adminAccountId: string,
  filters: { status?: FailureStatusFilter; accountId?: string },
): Promise<MatchingFailureRow[]> {
  if (!(await requireAdmin(adminAccountId))) return []
  const { db } = getRuntimeDb()
  const rows = await db
    .select({
      contactId: liveContacts.id,
      accountId: liveContacts.accountId,
      accountName: accounts.name,
      addressRaw: liveContacts.addressRaw,
      status: liveContacts.status,
      matchSource: liveContacts.matchSource,
      noParcelKind: liveContacts.noParcelKind,
      reviewState: liveContacts.reviewState,
      parcelApn: parcels.apn,
    })
    .from(liveContacts)
    .innerJoin(accounts, eq(accounts.id, liveContacts.accountId))
    .leftJoin(parcels, eq(parcels.id, liveContacts.parcelId))
    .where(filters.accountId ? eq(liveContacts.accountId, filters.accountId) : undefined)
    .orderBy(asc(accounts.name), asc(liveContacts.addressRaw), asc(liveContacts.id))

  const failed = rows.filter((row) => {
    if (!isMatchingFailure(row)) return false
    if (filters.status === 'corrected') return row.matchSource === 'corrected'
    if (filters.status) return row.status === filters.status
    return true
  })
  if (!failed.length) return []

  const stored = await db
    .select({
      contactId: contactMatchCandidates.contactId,
      confidence: contactMatchCandidates.confidence,
      reason: contactMatchCandidates.reason,
      rank: contactMatchCandidates.rank,
      apn: parcels.apn,
    })
    .from(contactMatchCandidates)
    .innerJoin(parcels, eq(parcels.id, contactMatchCandidates.parcelId))
    .where(
      inArray(
        contactMatchCandidates.contactId,
        failed.map((row) => row.contactId),
      ),
    )

  const byContact = new Map<string, MatchingFailureRow['candidates']>()
  for (const row of stored) {
    const list = byContact.get(row.contactId) ?? []
    list.push({
      label: `${row.apn} ${row.reason}`.trim(),
      confidence: row.confidence,
    })
    byContact.set(row.contactId, list)
  }

  return failed.map((row) => ({
    ...row,
    matcherReturned: matcherReturnedLabel(row.status, row.noParcelKind),
    howResolved: howResolvedLabel(row.status, row.matchSource, row.reviewState),
    candidates: (byContact.get(row.contactId) ?? []).sort((a, b) => b.confidence - a.confidence),
  }))
}
