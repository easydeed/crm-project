/**
 * The only way code reaches the contacts table. Enforced by src/db/contacts-access.test.ts.
 *
 * - liveContacts: every ordinary read. Soft-deleted people are not in it.
 * - contactsIncludingDeleted: the readers named in INCLUDE_DELETED_READERS, and no one else.
 * - contactsTable: insert / update / delete targets and their column references only.
 *   Reading from it fails the build.
 */
import { isNull } from 'drizzle-orm'
import { QueryBuilder } from 'drizzle-orm/pg-core'
import { contacts } from '@/db/schema'

export const liveContacts = new QueryBuilder()
  .select()
  .from(contacts)
  .where(isNull(contacts.deletedAt))
  .as('live_contacts')

/** Write target. `.from()` / `.join()` on it is a build failure. */
export const contactsTable = contacts

/** A live row, for the WHERE of an update or delete that must not touch deleted people. */
export const isLiveContact = isNull(contacts.deletedAt)

/**
 * Readers that must see soft-deleted people. Adding a file here is a review question:
 * is its reason as good as these?
 */
export const INCLUDE_DELETED_READERS = {
  // An old email's unsubscribe link must still work after the agent deletes that person.
  'src/unsubscribe/load.ts': 'renders the unsubscribe page for any token ever sent',
  // Stop, keep, and address update act on the person the link was sent to, deleted or not.
  'src/unsubscribe/act.ts': 'acts on the person an old unsubscribe link names',
  // Re-importing a soft-deleted address restores that row and its subscription state.
  'src/import/import-contacts.ts': 'finds soft-deleted rows to restore on re-import',
  // Send history survives a delete, and the monitor names who each email went to.
  'src/db/admin-sends.ts': 'shows who a past send went to, deleted or not',
  // A bounce or complaint for a deleted person still lands on their record.
  'src/mail/postmark-webhook.ts': 'records a bounce or complaint against every matching row',
  // Delivery and complaint rates count every email actually sent, including to people deleted since.
  'src/db/delivery-window.ts': 'counts sends and opt-outs that happened, whoever was deleted later',
} as const

/** The contacts table itself, for the readers above. */
export const contactsIncludingDeleted = contacts

/**
 * Every table with a foreign key to contacts, and whether its reads join through liveContacts.
 * The contacts-access test cannot see a query on one of these that never names contacts
 * (that is how the group count counted deleted people). contact-child-tables.test.ts fails
 * the build when a new referencing table appears here without a stated decision.
 */
export const CONTACT_CHILD_TABLES = {
  contact_subscriptions: 'live: home-send and compose join liveContacts; the unsubscribe page is an allowlisted reader',
  group_members: 'live: the group count joins liveContacts; the row stays so a restore brings membership back',
  contact_match_candidates: 'live: read only for people the review queue found through liveContacts',
  call_list_entries: 'live: the dashboard list joins liveContacts',
  call_log: 'history: read for one live person on their detail page, and as call-list priors',
  send_recipients: 'includes deleted: send history; send-job resolves the recipient through liveContacts',
  events: 'includes deleted: engagement history; nothing reads it yet',
} as const
