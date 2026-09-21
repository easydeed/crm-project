export type ContactMatchStatus = 'matched' | 'needs_review' | 'no_parcel'

export const CONTACT_STATUS_LABELS = {
  matched: 'On the map',
  needs_review: 'Needs a look',
  no_parcel: "Couldn't find",
} as const satisfies Record<ContactMatchStatus, string>

export function contactStatusLabel(status: ContactMatchStatus): string {
  return CONTACT_STATUS_LABELS[status]
}

export const STATUS_FILTERS = [
  { id: 'all' as const, label: 'All' },
  { id: 'matched' as const, label: CONTACT_STATUS_LABELS.matched },
  { id: 'needs_review' as const, label: CONTACT_STATUS_LABELS.needs_review },
  { id: 'no_parcel' as const, label: CONTACT_STATUS_LABELS.no_parcel },
]
