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
  variant = 'email',
}: {
  office: string | null
  agent: string | null
  /**
   * The email keeps its 12px ink. An app screen takes 15px, the smallest size that carries
   * information there, in the page's own color so it holds contrast in dark mode.
   */
  variant?: 'email' | 'app'
}) {
  return createElement(
    'p',
    {
      'data-mls-attribution': 'true',
      style: {
        margin: '10px 0 0 0',
        fontFamily: LABEL_FONT,
        fontSize: variant === 'app' ? 15 : 12,
        color: variant === 'app' ? 'inherit' : ink,
      },
    },
    mlsAttributionText(office, agent),
  )
}
