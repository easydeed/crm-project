import type { SkipReason } from '@/import/skip-reasons'

export type ImportRow = {
  line: number
  name: string
  email: string
  address: string
  closeDate: string | null
}

export type SkippedRow = {
  line: number
  name: string
  reason: SkipReason
}

export type ImportSummary = {
  added: number
  matched: number
  needsReview: number
  noParcel: number
  skipped: SkippedRow[]
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
