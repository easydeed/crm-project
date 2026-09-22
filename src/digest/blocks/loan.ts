import {
  escapeHtml,
  formatMoney,
  formatRecordedDay,
  latestOf,
} from '@/digest/format'
import { BODY_FONT, LABEL_FONT, ink } from '@/digest/style'
import { DEED_OF_TRUST, RECONVEYANCE, type DigestEvent } from '@/digest/types'

export function renderLoan(events: DigestEvent[]) {
  const notes = events.filter((event) => event.kind === DEED_OF_TRUST)
  const latest = latestOf(notes)
  if (!latest) return null
  const lender = latest.party?.trim() || 'the lender'
  const amount = latest.amount != null ? formatMoney(latest.amount) : 'an amount not stated'
  const day = formatRecordedDay(latest.recordedAt)
  const paid = events
    .filter((event) => event.kind === RECONVEYANCE)
    .filter((event) => event.recordedAt >= latest.recordedAt)
  const release = latestOf(paid)
  const lead = `The original loan on record is ${amount} from ${lender}, dated ${day}.`
  const follow = release
    ? `Paid off or refinanced — recorded ${formatRecordedDay(release.recordedAt)}.`
    : null
  const lines = [lead, follow].filter(Boolean) as string[]
  const html = `<tr><td style="padding:18px 28px;">
<p style="margin:0 0 8px 0;font-family:${LABEL_FONT};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${ink};">Your loan</p>
${lines.map((line) => `<p style="margin:0 0 8px 0;font-family:${BODY_FONT};font-size:17px;color:${ink};">${escapeHtml(line)}</p>`).join('')}
</td></tr>`
  return { name: 'loan' as const, html, text: lines.join('\n') }
}
