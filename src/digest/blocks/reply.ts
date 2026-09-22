import type { DigestAgent } from '@/digest/types'
import { escapeHtml } from '@/digest/format'
import { LABEL_FONT, paper } from '@/digest/style'

export function renderReply(agent: DigestAgent, accent: string) {
  const who = agent.senderName?.trim() || agent.name
  const href = agent.replyTo ? `mailto:${agent.replyTo}` : '#'
  const label = `Reply to ${who}`
  const html = `<tr><td style="padding:22px 28px 8px 28px;" align="center">
<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;background:${accent};color:${paper};font-family:${LABEL_FONT};font-size:15px;text-decoration:none;">${escapeHtml(label)}</a>
</td></tr>`
  return { html, text: label }
}
