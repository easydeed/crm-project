import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { MlsAttribution, mlsAttributionText } from '@/digest/mls-attribution'
import { escapeHtml, formatMoney } from '@/digest/format'
import { BODY_FONT, LABEL_FONT, ink } from '@/digest/style'
import type { DigestListing, DigestParcel } from '@/digest/types'

function sizeLine(
  label: string,
  beds: number | null,
  baths: string | null,
  sqft: number | null,
) {
  const bits: string[] = []
  if (beds != null) bits.push(`${beds} bed`)
  if (baths) bits.push(`${baths} bath`)
  if (sqft != null) bits.push(`${sqft.toLocaleString('en-US')} sq ft`)
  return bits.length ? `${label}: ${bits.join(', ')}` : null
}

export function renderFourDoors(
  parcel: DigestParcel,
  listing: DigestListing | null,
) {
  if (!listing) return null
  const price =
    listing.listPrice != null ? ` listed at ${formatMoney(listing.listPrice)}` : ''
  const lead = `A house at ${listing.address} is ${listing.status.toLowerCase()}${price}.`
  const yours = sizeLine('Your house', parcel.beds, parcel.baths, parcel.sqft)
  const theirs = sizeLine(
    'That listing',
    listing.beds,
    listing.baths,
    listing.sqft,
  )
  const attr = mlsAttributionText(listing.listingOffice, listing.listingAgent)
  const attrHtml = renderToStaticMarkup(
    createElement(MlsAttribution, {
      office: listing.listingOffice,
      agent: listing.listingAgent,
    }),
  )
  const lines = [lead, yours, theirs].filter(Boolean) as string[]
  const html = `<tr><td style="padding:18px 28px;">
<p style="margin:0 0 8px 0;font-family:${LABEL_FONT};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${ink};">Four doors down</p>
${lines.map((line) => `<p style="margin:0 0 8px 0;font-family:${BODY_FONT};font-size:17px;color:${ink};">${escapeHtml(line)}</p>`).join('')}
${attrHtml}
</td></tr>`
  return {
    name: 'four_doors' as const,
    html,
    text: [...lines, attr].join('\n'),
  }
}
