import { CALL_TAGS } from '@/app/app/call-tags'
import { computeSignals } from '@/signals/compute'
import { scenarios } from '@/signals/fixtures/scenarios'
import { selectCallList } from '@/signals/select'
import type { SignalKind } from '@/signals/types'

/**
 * The marketing page's sample call list (OR-053). Each entry is the real signal code run on its own
 * fixture contact: the sentence is the call list's own sentence, and every figure in it belongs to
 * the house it is shown with. Nothing is typed in, so nothing can be borrowed from another house.
 */
const SAMPLES: Array<{ scenario: string; kind: SignalKind }> = [
  { scenario: 'a strong nearby sale', kind: 'sold_nearby' },
  { scenario: 'a reconveyance', kind: 'loan_paid_off' },
  { scenario: 'a large tax gap with long tenure', kind: 'tax_upside' },
]

export type SampleCall = { kind: SignalKind; tag: string; address: string; detail: string }

export function sampleCalls(): SampleCall[] {
  return SAMPLES.map(({ scenario, kind }) => {
    const row = scenarios.find((candidate) => candidate.name === scenario)
    if (!row) throw new Error(`sample call: no signal scenario "${scenario}"`)
    const [signal] = selectCallList(computeSignals(row.input))
    if (!signal || signal.kind !== kind) throw new Error(`sample call: "${scenario}" no longer selects ${kind}`)
    const contact = row.input.contacts.find((candidate) => candidate.id === signal.contactId)
    if (!contact?.parcel) throw new Error(`sample call: "${scenario}" has no house`)
    return { kind, tag: CALL_TAGS[kind].label, address: contact.parcel.address, detail: signal.detail }
  })
}
