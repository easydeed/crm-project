import type { Contact, Lot } from './types'

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Place a client on a short stretch of their street, with a couple of recent
 * sales nearby — the same picture their monthly note is built from.
 */
export function clientLots(contact: Contact): Lot[] {
  const seed = hash(contact.id)
  const cols = 6
  const clientCol = 1 + (seed % (cols - 2))
  const soldColA = (clientCol + 2) % cols
  const soldColB = (clientCol + 4) % cols
  const lots: Lot[] = []

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < cols; col++) {
      const isClient = row === 0 && col === clientCol
      const isSold =
        (row === 1 && col === soldColA) || (row === 0 && col === soldColB)
      lots.push({
        id: `${row}-${col}`,
        col,
        row,
        kind: isClient ? 'client' : isSold ? 'sold' : 'plain',
        price: isClient
          ? contact.record?.assessedValue
          : isSold
            ? 780000 + ((hash(contact.id + row + col) % 45) * 10000)
            : undefined,
      })
    }
  }
  return lots
}
