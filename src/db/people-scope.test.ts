import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { getContactForAccount, listContactsForAccount } from '@/db/contacts'
import {
  deleteContactsForAccount,
  updateContactForAccount,
} from '@/db/contact-write'
import {
  getReviewItemForAccount,
  listReviewQueueForAccount,
  loadWrongHouseReview,
} from '@/db/review-queue'
import {
  chooseCandidateForAccount,
  fixReviewAddressForAccount,
  leaveOutContactForAccount,
  undoReviewChangeForAccount,
} from '@/db/review-write'
import {
  addContactsToGroup,
  createGroupForAccount,
  deleteGroupForAccount,
  listGroupsForAccount,
  removeContactsFromGroup,
  renameGroupForAccount,
} from '@/db/groups'

test('every contact and group function takes accountId first', () => {
  expect(listContactsForAccount.length).toBeGreaterThanOrEqual(1)
  expect(getContactForAccount.length).toBe(2)
  expect(updateContactForAccount.length).toBe(3)
  expect(deleteContactsForAccount.length).toBe(2)
  expect(listGroupsForAccount.length).toBe(1)
  expect(createGroupForAccount.length).toBe(2)
  expect(renameGroupForAccount.length).toBe(3)
  expect(deleteGroupForAccount.length).toBe(2)
  expect(addContactsToGroup.length).toBe(3)
  expect(removeContactsFromGroup.length).toBe(3)
  expect(listReviewQueueForAccount.length).toBe(1)
  expect(getReviewItemForAccount.length).toBe(2)
  expect(loadWrongHouseReview.length).toBe(2)
  expect(chooseCandidateForAccount.length).toBe(3)
  expect(leaveOutContactForAccount.length).toBe(2)
  expect(fixReviewAddressForAccount.length).toBe(3)
  expect(undoReviewChangeForAccount.length).toBe(2)
})

test('people data helpers do not read the session', () => {
  const files = ['contacts.ts', 'contact-write.ts', 'groups.ts', 'review-queue.ts', 'review-write.ts']
  for (const name of files) {
    const source = readFileSync(new URL(`./${name}`, import.meta.url), 'utf8')
    expect(source).not.toMatch(/cookies|readRequestSession|SESSION_COOKIE/)
  }
})

test('listContactsForAccount does not silently truncate', () => {
  const source = readFileSync(new URL('./contacts.ts', import.meta.url), 'utf8')
  const listFn = source.slice(
    source.indexOf('export async function listContactsForAccount'),
    source.indexOf('export async function getContactForAccount'),
  )
  expect(listFn).not.toMatch(/\.limit\(/)
  expect(listFn).not.toMatch(/\.slice\(/)
  expect(source).toContain('phone: liveContacts.phone')
})

test('mutations assertWritable before they write', () => {
  const contact = readFileSync(new URL('../people/save-contact.ts', import.meta.url), 'utf8')
  const groups = readFileSync(new URL('../people/save-groups.ts', import.meta.url), 'utf8')
  expect(contact.match(/assertWritable/g)?.length).toBeGreaterThanOrEqual(3)
  expect(groups.match(/assertWritable/g)?.length).toBeGreaterThanOrEqual(5)
  const review = readFileSync(new URL('../people/save-review.ts', import.meta.url), 'utf8')
  expect(review.match(/assertWritable/g)?.length).toBeGreaterThanOrEqual(4)
})
