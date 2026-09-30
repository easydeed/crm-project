import type { ContactMatchStatus } from '@/people/status'

const tag = 'inline-block rounded-full px-3 py-0.5'

/**
 * A contact's status as a tag. The label carries the meaning; the colour repeats it, using token
 * pairs the contrast test checks (tokens.test.ts).
 */
export const STATUS_TAG_CLASS: Record<ContactMatchStatus, string> = {
  matched: `${tag} bg-green-soft text-green-text`,
  needs_review: `${tag} bg-coral-soft text-coral-text`,
  no_parcel: `${tag} bg-surface text-muted-ink`,
}

export const UNSUBSCRIBED_TAG_CLASS = `${tag} bg-surface text-muted-ink`
