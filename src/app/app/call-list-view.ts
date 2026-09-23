import { formatRecordedDay } from '@/digest/format'
import { SIGNAL_KINDS, type SignalKind } from '@/signals/types'

export const CALL_LIST_SIZE = 3

export type CallEntryRow = {
  contactId: string
  name: string
  kind: string
  detail: string
  score: number
  address: string | null
  closeDate: string | null
}

export type CallEntry = {
  contactId: string
  name: string
  kind: SignalKind
  sentence: string
  address: string
  closeDate: string | null
}

export type CallList =
  | { kind: 'no-people' }
  | { kind: 'no-matches' }
  | { kind: 'list'; entries: CallEntry[]; quiet: boolean }

function isSignalKind(value: string): value is SignalKind {
  return (SIGNAL_KINDS as readonly string[]).includes(value)
}

/** Shapes stored call list rows for the dashboard. Never pads: fewer rows mean a quiet month. */
export function toCallList(input: {
  people: number
  matched: number
  rows: CallEntryRow[]
}): CallList {
  if (input.people === 0) return { kind: 'no-people' }
  if (input.matched === 0) return { kind: 'no-matches' }
  const entries = [...input.rows]
    .sort((a, b) => b.score - a.score || a.contactId.localeCompare(b.contactId))
    .flatMap((row): CallEntry[] => {
      if (!isSignalKind(row.kind) || !row.address) return []
      return [
        {
          contactId: row.contactId,
          name: row.name,
          kind: row.kind,
          sentence: row.detail,
          address: row.address,
          closeDate: row.closeDate ? formatRecordedDay(row.closeDate.slice(0, 10)) : null,
        },
      ]
    })
    .slice(0, CALL_LIST_SIZE)
  return { kind: 'list', entries, quiet: entries.length < CALL_LIST_SIZE }
}
