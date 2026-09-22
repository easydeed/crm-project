import {
  escapeHtml,
  formatMoney,
  formatRecordedDay,
  latestOf,
  ownedForPhrase,
} from '@/digest/format'
import { BODY_FONT, LABEL_FONT, ink, paper, stamp } from '@/digest/style'
import { GRANT_DEED, type DigestEvent, type DigestParcel } from '@/digest/types'

export function renderRecord(
  parcel: DigestParcel,
  events: DigestEvent[],
  asOf: Date,
) {
  const deeds = events.filter((event) => event.kind === GRANT_DEED)
  const latest = latestOf(deeds)
  if (!latest) return null
  const owned = ownedForPhrase(latest.recordedAt, asOf)
  const price = latest.amount != null ? formatMoney(latest.amount) : 'not stated'
  const vesting = latest.party?.trim() || 'not stated'
  const place = `${parcel.address}, ${parcel.city}, CA ${parcel.zip}`
  const recorded = formatRecordedDay(latest.recordedAt)
  const html = `<tr><td style="padding:18px 28px;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${paper};border:2px solid ${stamp};">
<tr><td style="padding:16px 18px;font-family:${LABEL_FONT};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${stamp};">Recorder stamp</td></tr>
<tr><td style="padding:0 18px 14px 18px;font-family:${BODY_FONT};font-size:16px;color:${ink};">
<div>Instrument / Grant Deed</div>
<div>Document ${escapeHtml(latest.docNumber)}</div>
<div>Recorded ${escapeHtml(recorded)}</div>
<div>Consideration ${escapeHtml(price)}</div>
<div>Vesting ${escapeHtml(vesting)}</div>
<div>${escapeHtml(place)}</div>
</td></tr>
</table>
${owned ? `<p style="margin:12px 0 0 0;font-family:${BODY_FONT};font-size:17px;color:${ink};">${escapeHtml(owned)}</p>` : ''}
</td></tr>`
  const text = [
    'Recorder stamp',
    'Instrument / Grant Deed',
    `Document ${latest.docNumber}`,
    `Recorded ${recorded}`,
    `Consideration ${price}`,
    `Vesting ${vesting}`,
    place,
    owned,
  ]
    .filter(Boolean)
    .join('\n')
  return { name: 'record' as const, html, text }
}
