import {
  escapeHtml,
  formatAboutMoney,
  formatMoney,
  medianAmount,
  roundToHundred,
  streetLabel,
  withinTrailingMonths,
} from '@/digest/format'
import { BODY_FONT, LABEL_FONT, ink } from '@/digest/style'
import type { DigestEvent, DigestInput, DigestParcel } from '@/digest/types'

export function streetMedianSale(
  parcel: DigestParcel,
  streetSales: DigestEvent[],
  asOf: Date,
) {
  const amounts = streetSales
    .filter((sale) => sale.amount != null && sale.amount > 0)
    .filter((sale) => withinTrailingMonths(sale.recordedAt, asOf, 12))
    .filter((sale) => {
      if (!parcel.useCode || !sale.propertyType) return true
      return sale.propertyType === parcel.useCode
    })
    .map((sale) => sale.amount as number)
  if (amounts.length < 2) return null
  return medianAmount(amounts)
}

export function renderTaxes(input: DigestInput) {
  const assessed = input.parcel.assessedValue
  if (assessed == null) return null
  const median = streetMedianSale(input.parcel, input.streetSales, input.asOf)
  if (median == null || assessed >= median) return null
  const benefit = roundToHundred((median - assessed) * input.tax.defaultTaxRatePct)
  const street = streetLabel(input.parcel.address)
  const soldLine = `Homes on ${street} have recently sold for ${formatAboutMoney(median)}. A buyer paying that would be taxed on it.`
  const countyLine = `The county taxes this house on ${formatMoney(assessed)}.`
  const saveLine = `That difference is ${formatAboutMoney(benefit)} a year.`
  const carry = 'California lets some homeowners carry this to their next home.'
  const lines = [soldLine, countyLine, saveLine, carry]
  const html = `<tr><td style="padding:18px 28px;">
<p style="margin:0 0 8px 0;font-family:${LABEL_FONT};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${ink};">Property taxes</p>
${lines.map((line) => `<p style="margin:0 0 8px 0;font-family:${BODY_FONT};font-size:17px;color:${ink};">${escapeHtml(line)}</p>`).join('')}
</td></tr>`
  return { name: 'taxes' as const, html, text: lines.join('\n') }
}
