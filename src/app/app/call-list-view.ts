import { formatRecordedDay } from '@/digest/format'
import { SIGNAL_KINDS, type SignalKind } from '@/signals/types'

export const CALL_LIST_SIZE = 3

/** What the agent needs on the phone: how to reach them and what the record says. */
export type CallPanel = {
  phone: string | null
  email: string
  record: string[]
  loan: string[]
}

export type CallEntryRow = {
  contactId: string
  name: string
  kind: string
  detail: string
  score: number
  address: string | null
  closeDate: string | null
  outcome?: 'called' | 'dismissed' | null
  panel?: CallPanel
}

export type CallEntry = {
  contactId: string
  name: string
  kind: SignalKind
  sentence: string
  address: string
  closeDate: string | null
  called: boolean
  panel: CallPanel | null
}

export type CallList =
  | { kind: 'no-people' }
  | { kind: 'no-matches' }
  | { kind: 'list'; entries: CallEntry[]; quiet: boolean }

function isSignalKind(value: string): value is SignalKind {
  return (SIGNAL_KINDS as readonly string[]).includes(value)
}

/**
 * Shapes stored call list rows for the dashboard. Never pads: fewer rows mean a quiet month.
 * "Not now" hides a name for the month; it does not make the month quiet.
 */
export function toCallList(input: {
  people: number
  matched: number
  rows: CallEntryRow[]
}): CallList {
  if (input.people === 0) return { kind: 'no-people' }
  if (input.matched === 0) return { kind: 'no-matches' }
  const valid = [...input.rows]
    .sort((a, b) => b.score - a.score || a.contactId.localeCompare(b.contactId))
    .filter((row) => isSignalKind(row.kind) && row.address)
    .slice(0, CALL_LIST_SIZE)
  const entries = valid
    .filter((row) => row.outcome !== 'dismissed')
    .map(
      (row): CallEntry => ({
        contactId: row.contactId,
        name: row.name,
        kind: row.kind as SignalKind,
        sentence: row.detail,
        address: row.address as string,
        closeDate: row.closeDate ? formatRecordedDay(row.closeDate.slice(0, 10)) : null,
        called: row.outcome === 'called',
        panel: row.panel ?? null,
      }),
    )
  return { kind: 'list', entries, quiet: valid.length < CALL_LIST_SIZE }
}
