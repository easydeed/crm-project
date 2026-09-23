import { formatMoney, formatRecordedDay, latestOf } from '@/digest/format'
import { DEED_OF_TRUST, GRANT_DEED, RECONVEYANCE, type DigestEvent } from '@/digest/types'

export function callRecordLines(closeDate: string | null, events: DigestEvent[]) {
  const lines: string[] = []
  if (closeDate) lines.push(`Closed ${formatRecordedDay(closeDate)}.`)

  const deed = latestOf(events.filter((event) => event.kind === GRANT_DEED))
  if (deed) {
    const price = deed.amount != null ? formatMoney(deed.amount) : 'an amount not stated'
    lines.push(`Recorded ${formatRecordedDay(deed.recordedAt)} for ${price}. Document ${deed.docNumber}.`)
  } else if (!closeDate) {
    lines.push('Nothing from the county record is on this house yet.')
  }

  const loan = latestOf(events.filter((event) => event.kind === DEED_OF_TRUST))
  if (!loan) return lines
  const lender = loan.party?.trim() || 'the lender'
  const amount = loan.amount != null ? formatMoney(loan.amount) : 'an amount not stated'
  lines.push(
    `The original loan on record is ${amount} from ${lender}, dated ${formatRecordedDay(loan.recordedAt)}.`,
  )
  const release = latestOf(
    events.filter((event) => event.kind === RECONVEYANCE && event.recordedAt >= loan.recordedAt),
  )
  if (release) {
    lines.push(`Paid off or refinanced — recorded ${formatRecordedDay(release.recordedAt)}.`)
  }
  return lines
}
