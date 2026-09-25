import type { z } from 'zod'

export type AddonBand = 'extras' | 'texting'

export type AddonConfigValue = string | number | boolean
export type AddonConfig = Record<string, AddonConfigValue>

/** A config schema is a zod object of string, number, boolean, and enum fields, each described. */
export type AddonConfigSchema = z.ZodObject<z.ZodRawShape>

/** What an add-on declares. Its price is not here: it comes from ADDON_PRICES in src/config/costs.ts. */
export type AddonDefinition = {
  key: string
  /** Plain language, agent-facing. */
  title: string
  /** One sentence. */
  blurb: string
  /** e.g. "+ postage", "250 included". */
  priceNote?: string
  band: AddonBand
  requiresConfig: boolean
  configSchema?: AddonConfigSchema
  onEnable?(accountId: string, config: AddonConfig): Promise<void>
  onDisable?(accountId: string): Promise<void>
}

export type ConfigField = {
  name: string
  label: string
  kind: 'text' | 'number' | 'boolean' | 'enum'
  options?: string[]
  optional: boolean
}

/** A registered add-on: the definition, its price, and the form fields its config needs. */
export type Addon = AddonDefinition & {
  priceCents: number
  fields: ConfigField[]
}
