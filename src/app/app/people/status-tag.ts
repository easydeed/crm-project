import type { ContactMatchStatus } from '@/people/status'

/** A status or call tag's shape (OR-042): 15px semibold, 8px by 12px, a 6px radius. Colour is the pair beside it. */
export const tagClass = 'inline-block rounded-sm px-3 py-2 text-[15px] font-semibold leading-none'
const tag = tagClass

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

/**
 * "Name matches" on a review card: the neutral pair, not green. Green means "On the map"; a name
 * match is evidence about a candidate house, not an answer, so the colour must not assert one.
 */
export const NAME_MATCH_TAG_CLASS = `${tag} bg-blue-soft text-foreground`
