import { withinTrailingDays } from '@/digest/format'
import type { ContentBlockName, DigestEvent } from '@/digest/types'

export const NEWS_WINDOW_DAYS = 45

const NEWS_BLOCKS = new Set<ContentBlockName>([
  'street_sales',
  'four_doors',
  'taxes',
])

export function hasRecentParcelDocument(events: DigestEvent[], asOf: Date) {
  return events.some((event) =>
    withinTrailingDays(event.recordedAt, asOf, NEWS_WINDOW_DAYS),
  )
}

export function digestHasNews(
  blocks: ContentBlockName[],
  events: DigestEvent[],
  asOf: Date,
) {
  if (blocks.some((name) => NEWS_BLOCKS.has(name))) return true
  return hasRecentParcelDocument(events, asOf)
}
