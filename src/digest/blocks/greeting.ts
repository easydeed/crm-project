import { escapeHtml } from '@/digest/format'
import { BODY_FONT, ink } from '@/digest/style'
import type { ContentBlockName } from '@/digest/types'

const HEADLINE: Record<ContentBlockName, string> = {
  four_doors: 'A house down the street is for sale.',
  taxes: 'What the county taxes you on, and what sold on your street.',
  loan: 'The loan the county has on record.',
  street_sales: 'What sold on your street.',
  record: 'What the county has on your house.',
}

const STRENGTH: ContentBlockName[] = [
  'four_doors',
  'taxes',
  'loan',
  'street_sales',
  'record',
]

export function pickHeadline(blocks: ContentBlockName[]) {
  const strongest = STRENGTH.find((name) => blocks.includes(name))
  return strongest ? HEADLINE[strongest] : 'A note about your house.'
}

export function renderGreeting(firstName: string, headline: string) {
  const hello = `Morning, ${firstName}.`
  const html = `<tr><td style="padding:24px 28px 8px 28px;">
<p style="margin:0 0 10px 0;font-family:${BODY_FONT};font-size:26px;line-height:1.3;color:${ink};">${escapeHtml(headline)}</p>
<p style="margin:0;font-family:${BODY_FONT};font-size:18px;color:${ink};">${escapeHtml(hello)}</p>
</td></tr>`
  return { html, text: `${headline}\n${hello}` }
}
