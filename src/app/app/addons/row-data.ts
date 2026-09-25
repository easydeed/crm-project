import type { AddonBand, AddonConfig, ConfigField } from '@/addons/types'
import { formatDollars } from '@/config/costs'

/** What the client needs to draw one add-on. Plain data: no schema, no hooks. */
export type AddonRowData = {
  key: string
  title: string
  blurb: string
  priceCents: number
  priceNote?: string
  band: AddonBand
  requiresConfig: boolean
  fields: ConfigField[]
  enabled: boolean
  config: AddonConfig
}

export const BANDS: { band: AddonBand; heading: string; note?: string }[] = [
  { band: 'extras', heading: 'Extras' },
  {
    band: 'texting',
    heading: 'Texting your clients',
    note: "Phone carriers charge us to send text messages to people, and they make us register first. That's why this one costs more.",
  },
]

export const EMPTY_STATE = "Nothing extra yet. We'll add things here."
export const KEEPS_SETTINGS = "Switching this off keeps these settings, so switching it back on won't ask again."
export const NEXT_BILL = 'Changes take effect on your next bill.'

export function priceLabel(row: Pick<AddonRowData, 'priceCents' | 'priceNote'>) {
  const price = row.priceCents === 0 ? 'Free' : `${formatDollars(row.priceCents)} a month`
  return row.priceNote ? `${price} ${row.priceNote}` : price
}
