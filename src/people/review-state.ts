import { foldText } from '@/matching/text'
import type { ContactMatchStatus } from '@/people/status'

export type ContactReviewState = 'pending' | 'reviewed'

export function isInReviewQueue(
  status: ContactMatchStatus,
  reviewState: ContactReviewState,
) {
  return status === 'needs_review' || (status === 'no_parcel' && reviewState === 'pending')
}

export function isLeftOut(
  status: ContactMatchStatus,
  reviewState: ContactReviewState,
) {
  return status === 'no_parcel' && reviewState === 'reviewed'
}

export function reviewHeader(position: number, total: number) {
  return `Needs a look · ${position} of ${total}`
}

export function contactLastName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.at(-1) ?? ''
}

export function nameMatchesOwner(contactName: string, recordedOwner: string | null) {
  if (!recordedOwner) return false
  const last = contactLastName(contactName)
  if (!last) return false
  const owner = foldText(recordedOwner)
  const needle = foldText(last)
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(owner)
}

export function formatHouseFacts(input: {
  beds: number | null
  baths: string | null
  sqft: number | null
}) {
  const parts: string[] = []
  if (input.beds != null) parts.push(`${input.beds} beds`)
  if (input.baths != null && input.baths !== '') {
    const n = Number(input.baths)
    const baths = Number.isFinite(n) && n % 1 === 0 ? String(n) : String(input.baths)
    parts.push(`${baths} baths`)
  }
  if (input.sqft != null) parts.push(`${input.sqft.toLocaleString('en-US')} sq ft`)
  return parts.length ? parts.join(' · ') : null
}

export function reviewLeftOutDone(count: number) {
  if (count === 1) {
    return "All done. 1 person won't get the email until you fix their address."
  }
  return `All done. ${count} people won't get the email until you fix their address.`
}
