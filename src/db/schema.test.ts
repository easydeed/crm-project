import { expect, test } from 'vitest'
import * as schema from '@/db/schema'

test('schema exports every OR-000 table', () => {
  const tables = [
    'accounts',
    'contacts',
    'contactSubscriptions',
    'groups',
    'groupMembers',
    'parcels',
    'parcelEvents',
    'mlsListings',
    'sends',
    'sendRecipients',
    'events',
    'subscriptions',
    'accountAddons',
    'adminActions',
    'jobs',
  ] as const

  for (const name of tables) {
    expect(schema[name], name).toBeDefined()
  }
})
