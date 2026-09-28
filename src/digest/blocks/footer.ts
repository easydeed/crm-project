import type { DigestAgent } from '@/digest/types'
import { escapeHtml } from '@/digest/format'
import { LABEL_FONT, ink } from '@/digest/style'

/** Name · brokerage · DRE. Said once per note: in the footer, or in the lender block when there is one. */
export function agentLine(agent: DigestAgent) {
  return [agent.name, agent.brokerage, agent.dre ? `DRE ${agent.dre}` : null].filter(Boolean).join(' · ')
}

export function renderFooter(agent: DigestAgent, { withAgentLine = true }: { withAgentLine?: boolean } = {}) {
  const shop = withAgentLine ? agentLine(agent) : null
  const source = 'Numbers come from county recorded documents and the assessor roll.'
  const update = 'Update this address'
  const leave = 'Unsubscribe'
  const html = `<tr><td style="padding:24px 28px 28px 28px;">
${shop ? `<p style="margin:0 0 8px 0;font-family:${LABEL_FONT};font-size:12px;color:${ink};">${escapeHtml(shop)}</p>
` : ''}<p style="margin:0 0 8px 0;font-family:${LABEL_FONT};font-size:12px;color:${ink};">${escapeHtml(source)}</p>
<p style="margin:0;font-family:${LABEL_FONT};font-size:12px;color:${ink};">
<a href="#update-address" style="color:${ink};">${escapeHtml(update)}</a>
 ·
<a href="#unsubscribe" style="color:${ink};">${escapeHtml(leave)}</a>
</p>
</td></tr>`
  return { html, text: [shop, source, update, leave].filter(Boolean).join('\n') }
}
