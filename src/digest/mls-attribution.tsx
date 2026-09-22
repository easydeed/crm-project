import { createElement } from 'react'
import { escapeHtml } from '@/digest/format'
import { LABEL_FONT, ink } from '@/digest/style'

export function mlsAttributionText(office: string | null, agent: string | null) {
  const who = [office?.trim(), agent?.trim()].filter(Boolean).join(' / ')
  return who
    ? `Listing courtesy of ${who}.`
    : 'Listing courtesy of the listing office.'
}

export function mlsAttributionHtml(office: string | null, agent: string | null) {
  return `<p data-mls-attribution="true" style="margin:10px 0 0 0;font-family:${LABEL_FONT};font-size:12px;color:${ink};">${escapeHtml(mlsAttributionText(office, agent))}</p>`
}

export function MlsAttribution({
  office,
  agent,
}: {
  office: string | null
  agent: string | null
}) {
  return createElement(
    'p',
    {
      'data-mls-attribution': 'true',
      style: {
        margin: '10px 0 0 0',
        fontFamily: LABEL_FONT,
        fontSize: 12,
        color: ink,
      },
    },
    mlsAttributionText(office, agent),
  )
}
