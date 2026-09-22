import type { ContentBlockName } from '@/digest/types'

const NEWS_BLOCKS = new Set<ContentBlockName>([
  'street_sales',
  'four_doors',
  'taxes',
])

export function digestHasNews(blocks: ContentBlockName[]) {
  return blocks.some((name) => NEWS_BLOCKS.has(name))
}
