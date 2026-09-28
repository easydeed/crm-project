import { configFields } from '@/addons/config-fields'
import type { Addon, AddonDefinition } from '@/addons/types'
import { ADDON_PRICES } from '@/config/costs'
import { LENDER } from '@/addons/lender'
import { TEXT_CALL_LIST } from '@/addons/text-call-list'

export type AddonRegistry = {
  list(): Addon[]
  get(key: string): Addon | undefined
}

/** Builds a registry. Anything wrong with a definition throws here, at startup. */
export function createRegistry(definitions: AddonDefinition[], prices: Record<string, number> = ADDON_PRICES.cents): AddonRegistry {
  const byKey = new Map<string, Addon>()
  for (const definition of definitions) {
    const { key } = definition
    if (byKey.has(key)) throw new Error(`Add-on ${key} is registered twice`)
    const priceCents = prices[key]
    if (priceCents === undefined) throw new Error(`Add-on ${key} has no price in ADDON_PRICES (src/config/costs.ts)`)
    if (definition.requiresConfig && !definition.configSchema) throw new Error(`Add-on ${key} requires config but has no configSchema`)
    if (definition.resolveConfig && !definition.configHref) throw new Error(`Add-on ${key} resolves its config but has no configHref`)
    const fields = definition.configSchema ? configFields(key, definition.configSchema) : []
    // A resolved config never renders a form: the server decides it, not the agent.
    byKey.set(key, { ...definition, priceCents, fields: definition.resolveConfig ? [] : fields })
  }
  const all = [...byKey.values()]
  return { list: () => all, get: (key) => byKey.get(key) }
}

/** Production add-ons. */
const PRODUCTION = createRegistry([TEXT_CALL_LIST, LENDER])

let current: AddonRegistry = PRODUCTION

export function getAddonRegistry(): AddonRegistry {
  return current
}

/** Tests install a registry of fixture add-ons here. Production keeps PRODUCTION. */
export function setAddonRegistry(next: AddonRegistry | null) {
  current = next ?? PRODUCTION
}
