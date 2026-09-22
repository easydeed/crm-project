import type { DigestAgent } from '@/digest/types'
import { escapeHtml } from '@/digest/format'
import { LABEL_FONT, BODY_FONT, ink, paper } from '@/digest/style'

export function renderHeader(agent: DigestAgent, accent: string) {
  const from = agent.senderName?.trim() || agent.name
  const shop = agent.brokerage?.trim()
  const html = `<tr><td style="padding:22px 28px 10px 28px;border-bottom:4px solid ${accent};background:${paper};">
<p style="margin:0;font-family:${LABEL_FONT};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${ink};">From</p>
<p style="margin:6px 0 0 0;font-family:${BODY_FONT};font-size:20px;color:${ink};">${escapeHtml(from)}</p>
${shop ? `<p style="margin:4px 0 0 0;font-family:${BODY_FONT};font-size:15px;color:${ink};">${escapeHtml(shop)}</p>` : ''}
</td></tr>`
  const text = [`From ${from}`, shop].filter(Boolean).join('\n')
  return { html, text }
}
