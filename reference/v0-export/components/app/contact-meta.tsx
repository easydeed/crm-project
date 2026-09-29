import type { ContactStatus, Engagement } from '@/lib/types'
import type { Tone } from '@/components/tag'

export const STATUS_META: Record<
  ContactStatus,
  { label: string; tone: Tone }
> = {
  matched: { label: 'On the map', tone: 'green' },
  needs_review: { label: 'Needs review', tone: 'coral' },
  no_parcel: { label: 'No parcel', tone: 'coral' },
}

export const ENGAGEMENT_META: Record<
  Engagement,
  { label: string; tone: Tone }
> = {
  opened_recently: { label: 'Opening', tone: 'blue' },
  quiet: { label: 'Quiet', tone: 'grey' },
  moved: { label: 'May have moved', tone: 'coral' },
  never_opened: { label: 'Never opened', tone: 'grey' },
}
