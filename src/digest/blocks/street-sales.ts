import {
  escapeHtml,
  formatMoney,
  formatRecordedDay,
} from '@/digest/format'
import { BODY_FONT, LABEL_FONT, ink } from '@/digest/style'
import type { DigestEvent } from '@/digest/types'

export function renderStreetSales(streetSales: DigestEvent[]) {
  const sales = streetSales
    .filter((sale) => sale.amount != null)
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))
    .slice(0, 3)
  if (!sales.length) return null
  const lines = sales.map((sale) => {
    const price = formatMoney(sale.amount as number)
    const day = formatRecordedDay(sale.recordedAt)
    return `${price} — recorded ${day} · document ${sale.docNumber}`
  })
  const html = `<tr><td style="padding:18px 28px;">
<p style="margin:0 0 8px 0;font-family:${LABEL_FONT};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${ink};">What sold on your street</p>
${lines.map((line) => `<p style="margin:0 0 8px 0;font-family:${BODY_FONT};font-size:17px;color:${ink};">${escapeHtml(line)}</p>`).join('')}
</td></tr>`
  return { name: 'street_sales' as const, html, text: lines.join('\n') }
}
