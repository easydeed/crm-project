import { daysBetween, dayFromAsOf, formatMoney, parseDay, withinTrailingDays, wordNumber } from '@/digest/format'
import type { Signal, SignalContact, SignalInput, StreetSale } from '@/signals/types'

const WINDOW_DAYS = 45
const SOLD_BASE = 200
const RECORD_BONUS = 60
const MAX_DOORS = 5

function houseNumber(address: string) {
  const match = /^\s*(\d+)/.exec(address)
  if (!match) return null
  return Number(match[1])
}

function doorsBetween(home: string, sale: string) {
  const left = houseNumber(home)
  const right = houseNumber(sale)
  if (left == null || right == null || left === right) return null
  const diff = Math.abs(left - right)
  const across = left % 2 !== right % 2
  if (across) {
    if (diff > MAX_DOORS) return null
    return { doors: Math.max(1, diff), across: true }
  }
  if (diff % 2 !== 0) return null
  const doors = diff / 2
  if (doors < 1 || doors > MAX_DOORS) return null
  return { doors, across: false }
}

function place(doors: number, across: boolean) {
  if (across) return 'across the street'
  if (doors === 1) return 'next door'
  return `${wordNumber(doors)} doors down`
}

function onStreet(contact: SignalContact, sale: StreetSale) {
  const home = contact.parcel
  if (!home || !home.streetNameNorm) return false
  return sale.zip === home.zip && sale.streetNameNorm === home.streetNameNorm && sale.parcelId !== home.id
}

function isRecord(sale: StreetSale, street: StreetSale[]) {
  if (sale.amount == null) return false
  const others = street.filter((row) => row.docNumber !== sale.docNumber && row.amount != null && row.amount > 0)
  if (!others.length) return false
  return others.every((row) => (row.amount as number) < (sale.amount as number))
}

function proximity(doors: number, across: boolean) {
  if (across) return 40
  return (6 - doors) * 20
}

export function soldNearby(contact: SignalContact, input: SignalInput): Signal | null {
  const home = contact.parcel
  if (contact.status !== 'matched' || !home) return null
  const street = input.streetSales.filter((sale) => onStreet(contact, sale))
  let best: { sale: StreetSale; score: number; doors: number; across: boolean } | null = null
  for (const sale of street) {
    if (sale.amount == null || sale.amount <= 0) continue
    if (!withinTrailingDays(sale.recordedAt, input.asOf, WINDOW_DAYS)) continue
    const span = doorsBetween(home.address, sale.address)
    if (!span) continue
    const recorded = parseDay(sale.recordedAt)
    if (!recorded) continue
    const daysAgo = daysBetween(recorded, dayFromAsOf(input.asOf))
    const record = isRecord(sale, street)
    const score = SOLD_BASE + proximity(span.doors, span.across) + (WINDOW_DAYS - daysAgo) + (record ? RECORD_BONUS : 0)
    if (!best || score > best.score || (score === best.score && sale.amount > (best.sale.amount ?? 0))) {
      best = { sale, score, doors: span.doors, across: span.across }
    }
  }
  if (!best) return null
  const price = formatMoney(best.sale.amount as number)
  const high = isRecord(best.sale, street) ? ' — the highest price their street has seen' : ''
  return {
    contactId: contact.id,
    kind: 'sold_nearby',
    detail: `A house ${place(best.doors, best.across)} sold for ${price}${high}.`,
    score: best.score,
    asOf: input.asOf,
  }
}
