import type { AddressFixture, MatchStatus } from '@/matching/types'

export type ExportableFailure = {
  addressRaw: string
  status: MatchStatus
  matchSource: 'auto' | 'review' | 'corrected'
  parcelApn: string | null
  howResolved: string
}

export function failureToFixture(row: ExportableFailure): AddressFixture {
  if (row.matchSource === 'corrected' || row.status === 'matched') {
    return {
      raw: row.addressRaw,
      expect: 'matched',
      ...(row.parcelApn ? { expectApn: row.parcelApn } : {}),
      note: row.howResolved,
    }
  }
  if (row.status === 'needs_review') {
    return { raw: row.addressRaw, expect: 'needs_review', note: row.howResolved }
  }
  return { raw: row.addressRaw, expect: 'no_parcel', note: row.howResolved }
}

export function fixturesToJson(rows: ExportableFailure[]) {
  return `${JSON.stringify(rows.map(failureToFixture), null, 2)}\n`
}

export function exportHasIdentity(payload: string, banned: string[]) {
  const lower = payload.toLowerCase()
  return banned.some((value) => value && lower.includes(value.toLowerCase()))
}
