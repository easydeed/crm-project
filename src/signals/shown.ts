import type { PriorCall } from '@/signals/types'

export function mergeShown(entries: PriorCall[], logged: PriorCall[]): PriorCall[] {
  const seen = new Set<string>()
  const out: PriorCall[] = []
  for (const row of [...entries, ...logged]) {
    const key = `${row.contactId}:${row.period}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ contactId: row.contactId, period: row.period })
  }
  return out
}
