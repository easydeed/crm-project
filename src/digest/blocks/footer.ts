import type { DigestAgent } from '@/digest/types'
import { escapeHtml } from '@/digest/format'
import { LABEL_FONT, ink } from '@/digest/style'

export function renderFooter(agent: DigestAgent) {
  const shop = [agent.name, agent.brokerage, agent.dre ? `DRE ${agent.dre}` : null]
    .filter(Boolean)
    .join(' · ')
  const source = 'Numbers come from county recorded documents and the assessor roll.'
  const update = 'Update this address'
  const leave = 'Unsubscribe'
  const html = `<tr><td style="padding:24px 28px 28px 28px;">
<p style="margin:0 0 8px 0;font-family:${LABEL_FONT};font-size:12px;color:${ink};">${escapeHtml(shop)}</p>
<p style="margin:0 0 8px 0;font-family:${LABEL_FONT};font-size:12px;color:${ink};">${escapeHtml(source)}</p>
<p style="margin:0;font-family:${LABEL_FONT};font-size:12px;color:${ink};">
<a href="#update-address" style="color:${ink};">${escapeHtml(update)}</a>
 ·
<a href="#unsubscribe" style="color:${ink};">${escapeHtml(leave)}</a>
</p>
</td></tr>`
  return { html, text: [shop, source, update, leave].join('\n') }
}
