import { z } from 'zod'
import { createRegistry } from '@/addons/registry'
import type { AddonDefinition } from '@/addons/types'

/**
 * Test-only add-ons. Never registered in production: addons-access.test.ts fails the
 * build if anything but a test file imports this module.
 */
export const FIXTURE_PLAIN: AddonDefinition = {
  key: 'fixture_plain',
  title: 'Fixture extra',
  blurb: 'A plain add-on with no settings.',
  band: 'extras',
  requiresConfig: false,
}

export const FIXTURE_CONFIG: AddonDefinition = {
  key: 'fixture_config',
  title: 'Fixture with settings',
  blurb: 'An add-on that needs a name before it can switch on.',
  band: 'extras',
  requiresConfig: true,
  configSchema: z.object({
    name: z.string().min(2, 'At least two letters.').describe('Name'),
    count: z.number().int().positive().optional().describe('How many'),
  }),
}

export const FIXTURE_TEXTING: AddonDefinition = {
  key: 'fixture_texting',
  title: 'Fixture texting',
  blurb: 'Stands in for anything that touches phone carriers.',
  priceNote: '250 included',
  band: 'texting',
  requiresConfig: false,
}

export const FIXTURE_PRICES: Record<string, number> = { fixture_plain: 200, fixture_config: 0, fixture_texting: 900 }

export function fixtureRegistry() {
  return createRegistry([FIXTURE_PLAIN, FIXTURE_CONFIG, FIXTURE_TEXTING], FIXTURE_PRICES)
}
