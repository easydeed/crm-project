import { agentLine } from '@/digest/blocks/footer'
import { escapeHtml } from '@/digest/format'
import { LABEL_FONT, ink, rule } from '@/digest/style'
import type { DigestAgent, DigestLender } from '@/digest/types'

/**
 * The agent and their lender partner, two lines of equal weight split by a hairline.
 * A co-brand, not an ad: it sits below the reply button, above the footer, and says
 * who the lender is. No rate, no product, no call to action.
 */
export function renderLender(agent: DigestAgent, lender: DigestLender) {
  const lenderLine = [lender.name, lender.company, `NMLS ${lender.nmls}`].filter(Boolean).join(' · ')
  const line = `font-family:${LABEL_FONT};font-size:13px;color:${ink};margin:0;`
  const html = `<tr><td style="padding:20px 28px 0 28px;">
<p style="${line}padding-bottom:8px;border-bottom:1px solid ${rule};">${escapeHtml(agentLine(agent))}</p>
<p style="${line}padding-top:8px;"><a href="mailto:${escapeHtml(lender.email)}" style="color:${ink};">${escapeHtml(lenderLine)}</a></p>
</td></tr>`
  return { html, text: [agentLine(agent), lenderLine, lender.email].join('\n') }
}
