import { daysBetween, dayFromAsOf, latestOf, parseDay, withinTrailingDays } from '@/digest/format'
import { RECONVEYANCE } from '@/digest/types'
import type { Signal, SignalContact, SignalInput } from '@/signals/types'

const WINDOW_DAYS = 45
const LOAN_BASE = 200

export function loanPaidOff(contact: SignalContact, input: SignalInput): Signal | null {
  if (contact.status !== 'matched' || !contact.parcel) return null
  const recent = contact.events.filter(
    (event) => event.kind === RECONVEYANCE && withinTrailingDays(event.recordedAt, input.asOf, WINDOW_DAYS),
  )
  const latest = latestOf(recent)
  if (!latest) return null
  const recorded = parseDay(latest.recordedAt)
  if (!recorded) return null
  const daysAgo = daysBetween(recorded, dayFromAsOf(input.asOf))
  return {
    contactId: contact.id,
    kind: 'loan_paid_off',
    detail: 'Their mortgage was just paid off or refinanced. Something changed with their money this month.',
    score: LOAN_BASE + (WINDOW_DAYS - daysAgo),
    asOf: input.asOf,
  }
}
