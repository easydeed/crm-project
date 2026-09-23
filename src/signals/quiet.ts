import { periodOf, shiftPeriod } from '@/signals/period'
import type { Signal, SignalContact, SignalInput } from '@/signals/types'

const QUIET_SCORE = 30

function seenInSixMonths(contactId: string, input: SignalInput) {
  const current = periodOf(input.asOf)
  const oldest = shiftPeriod(current, -6)
  return input.priorCalls.some(
    (prior) => prior.contactId === contactId && prior.period >= oldest && prior.period < current,
  )
}

export function quietSignals(input: SignalInput, alreadySignaled: Set<string>): Signal[] {
  const found: Signal[] = []
  for (const contact of input.contacts) {
    if (!qualifies(contact, input, alreadySignaled)) continue
    found.push({
      contactId: contact.id,
      kind: 'quiet_a_while',
      detail: "You haven't had a reason to call in a while.",
      score: QUIET_SCORE,
      asOf: input.asOf,
    })
  }
  return found
}

function qualifies(contact: SignalContact, input: SignalInput, alreadySignaled: Set<string>) {
  if (alreadySignaled.has(contact.id)) return false
  if (contact.status !== 'matched' || !contact.subscribed || !contact.parcel) return false
  if (seenInSixMonths(contact.id, input)) return false
  return true
}
