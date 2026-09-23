import { loanPaidOff } from '@/signals/loan-paid-off'
import { quietSignals } from '@/signals/quiet'
import { selectCallList, strongestPerContact, withoutLastMonth } from '@/signals/select'
import { soldNearby } from '@/signals/sold-nearby'
import { taxUpside } from '@/signals/tax-upside'
import type { Signal, SignalInput } from '@/signals/types'

export function computeSignals(input: SignalInput): Signal[] {
  const raw: Signal[] = []
  for (const contact of input.contacts) {
    const sold = soldNearby(contact, input)
    if (sold) raw.push(sold)
    const loan = loanPaidOff(contact, input)
    if (loan) raw.push(loan)
    const tax = taxUpside(contact, input)
    if (tax) raw.push(tax)
  }
  const covered = new Set(raw.map((signal) => signal.contactId))
  const pool = withoutLastMonth(
    [...strongestPerContact(raw), ...quietSignals(input, covered)],
    input,
  )
  return selectCallList(pool)
}
