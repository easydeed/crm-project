import { createElement } from 'react'
import { LABEL_FONT, ink } from '@/digest/style'

export function mlsAttributionText(office: string | null, agent: string | null) {
  const who = [office?.trim(), agent?.trim()].filter(Boolean).join(' / ')
  return who
    ? `Listing courtesy of ${who}.`
    : 'Listing courtesy of the listing office.'
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
