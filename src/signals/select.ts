import { periodOf, shiftPeriod } from '@/signals/period'
import type { Signal, SignalInput, SignalKind } from '@/signals/types'

export const SCORE_CLOSE = 40

const KIND_ORDER: Record<SignalKind, number> = {
  sold_nearby: 0,
  loan_paid_off: 1,
  tax_upside: 2,
  quiet_a_while: 3,
}

const NEW_EVENT: SignalKind[] = ['sold_nearby', 'loan_paid_off']

export function compareStrength(left: Signal, right: Signal) {
  if (left.score !== right.score) return right.score - left.score
  const kind = KIND_ORDER[left.kind] - KIND_ORDER[right.kind]
  if (kind !== 0) return kind
  return left.contactId.localeCompare(right.contactId)
}

export function strongestPerContact(signals: Signal[]) {
  const byContact = new Map<string, Signal>()
  for (const signal of signals) {
    const prev = byContact.get(signal.contactId)
    if (!prev || compareStrength(signal, prev) < 0) byContact.set(signal.contactId, signal)
  }
  return [...byContact.values()]
}

export function withoutLastMonth(signals: Signal[], input: SignalInput) {
  const lastMonth = shiftPeriod(periodOf(input.asOf), -1)
  const repeated = new Set(
    input.priorCalls.filter((prior) => prior.period === lastMonth).map((prior) => prior.contactId),
  )
  return signals.filter((signal) => {
    if (!repeated.has(signal.contactId)) return true
    return NEW_EVENT.includes(signal.kind)
  })
}

export function selectCallList(signals: Signal[]) {
  const pool = [...signals].sort(compareStrength)
  const chosen: Signal[] = []
  const used = new Set<string>()
  while (chosen.length < 3) {
    const open = pool.filter((signal) => !used.has(signal.contactId))
    if (!open.length) break
    const best = open[0]
    const same = chosen.filter((signal) => signal.kind === best.kind).length
    let pick = best
    if (same >= 2) {
      const other = open.find((signal) => signal.kind !== best.kind)
      if (other) pick = other
    } else if (same >= 1) {
      const other = open.find(
        (signal) => signal.kind !== best.kind && best.score - signal.score <= SCORE_CLOSE,
      )
      if (other) pick = other
    }
    chosen.push(pick)
    used.add(pick.contactId)
  }
  return chosen
}
