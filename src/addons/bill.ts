export type BillLine = { key: string; label: string; cents: number }
export type Bill = { lines: BillLine[]; totalCents: number }

/** Base plan first, then each enabled add-on in the order given. Only enabled add-ons appear. */
export function computeBill(baseCents: number, addons: { key: string; title: string; priceCents: number; enabled: boolean }[]): Bill {
  const lines: BillLine[] = [
    { key: 'base', label: 'Base plan', cents: baseCents },
    ...addons.filter((addon) => addon.enabled).map((addon) => ({ key: addon.key, label: addon.title, cents: addon.priceCents })),
  ]
  return { lines, totalCents: lines.reduce((total, line) => total + line.cents, 0) }
}
