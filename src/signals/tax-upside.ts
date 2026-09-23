import { formatMoney, monthsBetween, parseDay, dayFromAsOf } from '@/digest/format'
import { streetMedianSale } from '@/digest/blocks/taxes'
import type { DigestEvent } from '@/digest/types'
import type { Signal, SignalContact, SignalInput, StreetSale } from '@/signals/types'

const TAX_BASE = 180
const MIN_GAP = 0.15
const MIN_YEARS = 5

function yearsOwned(closeDate: string | null, asOf: Date) {
  const start = closeDate ? parseDay(closeDate) : null
  if (!start) return 0
  const months = monthsBetween(start, dayFromAsOf(asOf))
  if (months < 0) return 0
  return Math.floor(months / 12)
}

function asDigestSale(sale: StreetSale): DigestEvent {
  return {
    kind: 'grant_deed',
    docNumber: sale.docNumber,
    recordedAt: sale.recordedAt,
    amount: sale.amount,
    party: null,
    propertyType: sale.useCode,
    address: sale.address,
  }
}

export function taxUpside(contact: SignalContact, input: SignalInput): Signal | null {
  const home = contact.parcel
  if (contact.status !== 'matched' || !home || home.assessedValue == null) return null
  const years = yearsOwned(contact.closeDate, input.asOf)
  if (years < MIN_YEARS) return null
  const street = input.streetSales.filter(
    (sale) =>
      sale.parcelId !== home.id &&
      sale.zip === home.zip &&
      home.streetNameNorm !== '' &&
      sale.streetNameNorm === home.streetNameNorm,
  )
  const median = streetMedianSale(
    {
      address: home.address,
      city: '',
      zip: home.zip,
      beds: null,
      baths: null,
      sqft: null,
      useCode: home.useCode,
      assessedValue: home.assessedValue,
    },
    street.map(asDigestSale),
    input.asOf,
  )
  if (median == null || home.assessedValue >= median) return null
  const gap = (median - home.assessedValue) / median
  if (gap < MIN_GAP) return null
  const gapPoints = Math.min(80, Math.round(gap * 100))
  const tenurePoints = Math.min(40, years * 2)
  return {
    contactId: contact.id,
    kind: 'tax_upside',
    detail: `They're taxed on ${formatMoney(home.assessedValue)} while homes on their street sell around ${formatMoney(median)}. If they're over 55, they can carry that to their next house.`,
    score: TAX_BASE + gapPoints + tenurePoints,
    asOf: input.asOf,
  }
}
