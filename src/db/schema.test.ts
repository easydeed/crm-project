import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { callListEntries } from '@/db/schema-call-lists'
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
    'contactMatchCandidates',
    'jobs',
  ] as const

  for (const name of tables) {
    expect(schema[name], name).toBeDefined()
  }
  expect(schema.parcels.streetNameNorm).toBeDefined()
  expect(schema.contactReviewStateEnum).toBeDefined()
  expect(schema.contacts.reviewState).toBeDefined()
  expect(schema.contactMatchSourceEnum).toBeDefined()
  expect(schema.contactNoParcelKindEnum).toBeDefined()
  expect(schema.contacts.matchSource).toBeDefined()
  expect(schema.contacts.noParcelKind).toBeDefined()
  expect(schema.jobs.payloadKey).toBeDefined()
  expect(schema.mailEvents).toBeDefined()
  expect(schema.sends.composedCount).toBeDefined()
  expect(schema.sendRecipients.plainText).toBeDefined()
  expect(schema.sendRecipients.subject).toBeDefined()
})

test('jobs unique index covers kind, payload_key, and run_after', () => {
  const source = readFileSync(new URL('./schema-jobs.ts', import.meta.url), 'utf8')
  expect(source).toContain("uniqueIndex('jobs_kind_payload_key_run_after_uidx')")
  expect(source).toContain('t.payloadKey')
  expect(source).toContain('t.runAfter')
  expect(source).toContain('could send the same note twice')
})

test('call list entries are unique per account, contact, and period', () => {
  expect(callListEntries.accountId).toBeDefined()
  expect(callListEntries.period).toBeDefined()
  const source = readFileSync(new URL('./schema-call-lists.ts', import.meta.url), 'utf8')
  expect(source).toContain("uniqueIndex('call_list_entries_account_contact_period_uidx')")
  expect(source).toContain('t.accountId')
  expect(source).toContain('t.contactId')
  expect(source).toContain('t.period')
})

test('a call log row is unique per account, contact, and period', () => {
  const source = readFileSync(new URL('./schema-call-lists.ts', import.meta.url), 'utf8')
  expect(source).toContain("uniqueIndex('call_log_account_contact_period_uidx')")
  expect(source).toContain("outcome: text('outcome').notNull()")
})
