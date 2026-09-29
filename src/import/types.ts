import type { SUPPRESSED_REASON } from '@/suppression/suppressions'
import type { SkipReason } from '@/import/skip-reasons'

export type ImportRow = {
  line: number
  name: string
  /**
   * Null when the source has no email field at all (an MLS closing): the row is imported
   * without one and deduped by address. A CSV row always has a string, and an empty or
   * invalid one is still skipped.
   */
  email: string | null
  address: string
  closeDate: string | null
}

export type SkippedRow = {
  line: number
  name: string
  reason: SkipReason | typeof SUPPRESSED_REASON
}

export type ImportSummary = {
  added: number
  /** Soft-deleted people whose address came back; restored with their subscription state. */
  restored: number
  matched: number
  needsReview: number
  noParcel: number
  skipped: SkippedRow[]
  /** Added, but unsubscribed: their address is on the suppression list. */
  optedOut: SkippedRow[]
  elapsedMs: number
}

export type ImportState = {
  error?: string
  result?: ImportSummary
}

export type FieldRole =
  | 'name'
  | 'first'
  | 'last'
  | 'email'
  | 'address'
  | 'street'
  | 'city'
  | 'zip'
  | 'closeDate'
  | 'skip'

export type ColumnDetection = {
  mapping: FieldRole[]
  confident: boolean
}
