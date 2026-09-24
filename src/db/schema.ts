import { sql } from 'drizzle-orm'
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const accountRoleEnum = pgEnum('account_role', ['agent', 'admin'])
export const contactStatusEnum = pgEnum('contact_status', ['matched', 'needs_review', 'no_parcel'])
export const contactReviewStateEnum = pgEnum('contact_review_state', ['pending', 'reviewed'])
export const contactMatchSourceEnum = pgEnum('contact_match_source', ['auto', 'review', 'corrected'])
export const contactNoParcelKindEnum = pgEnum('contact_no_parcel_kind', ['non_address', 'unmatched'])
export const subscriptionScopeEnum = pgEnum('subscription_scope', ['monthly', 'weekly'])
export const eventKindEnum = pgEnum('event_kind', ['opened', 'clicked'])

function createdAt() {
  return timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  brokerage: text('brokerage'),
  dre: text('dre'),
  phone: text('phone'),
  role: accountRoleEnum('role').notNull(),
  senderName: text('sender_name'),
  replyTo: text('reply_to'),
  accentColor: text('accent_color'),
  sendDay: integer('send_day'),
  sendTime: text('send_time'),
  timezone: text('timezone'),
  paused: boolean('paused').notNull().default(false),
  lastLoggedInAt: timestamp('last_logged_in_at', { withTimezone: true }),
  mlsAgentId: text('mls_agent_id'),
  createdAt: createdAt(),
})

export const parcels = pgTable(
  'parcels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    apn: text('apn').notNull(),
    county: text('county').notNull(),
    address: text('address').notNull(),
    city: text('city').notNull(),
    zip: text('zip').notNull(),
    streetNameNorm: text('street_name_norm').notNull().default(''),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    beds: integer('beds'),
    baths: numeric('baths'),
    sqft: integer('sqft'),
    yearBuilt: integer('year_built'),
    useCode: text('use_code'),
    assessedValue: integer('assessed_value'),
    baseYear: integer('base_year'),
    baseYearValue: integer('base_year_value'),
    lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('parcels_county_apn_uidx').on(t.county, t.apn),
    index('parcels_zip_idx').on(t.zip),
    index('parcels_city_address_idx').on(t.city, t.address),
    index('parcels_zip_street_name_norm_idx').on(t.zip, t.streetNameNorm),
    index('parcels_street_name_norm_trgm_idx').using('gin', t.streetNameNorm.op('gin_trgm_ops')),
  ],
)

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    addressRaw: text('address_raw').notNull(),
    parcelId: uuid('parcel_id').references(() => parcels.id, { onDelete: 'restrict' }),
    closeDate: date('close_date'),
    notes: text('notes'),
    homeownerAddressAt: timestamp('homeowner_address_at', { withTimezone: true }),
    /** Soft delete. Read contacts only through src/db/live-contacts.ts. */
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    status: contactStatusEnum('status').notNull(),
    reviewState: contactReviewStateEnum('review_state').notNull().default('pending'),
    matchSource: contactMatchSourceEnum('match_source').notNull().default('auto'),
    noParcelKind: contactNoParcelKindEnum('no_parcel_kind'),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('contacts_account_email_uidx').on(
      t.accountId,
      sql`lower(${t.email})`,
    ),
  ],
)
// Created with every contact by trigger contacts_subscribe_on_insert (migration 0006); opt-outs live in suppressions.
export const contactSubscriptions = pgTable(
  'contact_subscriptions',
  {
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    scope: subscriptionScopeEnum('scope').notNull(),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.contactId, t.scope] })],
)

export const groups = pgTable(
  'groups',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
  },
  (t) => [
    uniqueIndex('groups_account_name_uidx').on(t.accountId, sql`lower(${t.name})`),
  ],
)

export const groupMembers = pgTable(
  'group_members',
  {
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.contactId] })],
)

export const parcelEvents = pgTable(
  'parcel_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    parcelId: uuid('parcel_id')
      .notNull()
      .references(() => parcels.id, { onDelete: 'cascade' }),
    county: text('county').notNull(),
    kind: text('kind').notNull(),
    docNumber: text('doc_number').notNull(),
    recordedAt: date('recorded_at').notNull(),
    amount: integer('amount'),
    party: text('party'),
    raw: jsonb('raw').$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => [uniqueIndex('parcel_events_county_doc_uidx').on(t.county, t.docNumber)],
)

export const mlsListings = pgTable('mls_listings', {
  id: uuid('id').defaultRandom().primaryKey(),
  mlsId: text('mls_id').notNull().unique(),
  zip: text('zip').notNull(),
  address: text('address').notNull(),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  status: text('status').notNull(),
  listPrice: integer('list_price'),
  listDate: date('list_date'),
  closePrice: integer('close_price'),
  closeDate: date('close_date'),
  beds: integer('beds'),
  baths: numeric('baths'),
  sqft: integer('sqft'),
  propertyType: text('property_type'),
  listingOffice: text('listing_office'),
  listingAgent: text('listing_agent'),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }),
})
export const sends = pgTable(
  'sends',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
    state: text('state').notNull(),
    composedCount: integer('composed_count').notNull().default(0),
    skippedCount: integer('skipped_count').notNull().default(0),
    skips: jsonb('skips').$type<{ contactId: string; reason: string }[]>().notNull().default([]),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('sends_account_scheduled_for_uidx').on(t.accountId, t.scheduledFor)],
)

export const sendRecipients = pgTable(
  'send_recipients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sendId: uuid('send_id')
      .notNull()
      .references(() => sends.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'no action' }), // deferred to commit: migration 0009
    html: text('html'),
    plainText: text('plain_text'),
    subject: text('subject'),
    error: text('error'),
    permanentFailure: boolean('permanent_failure').notNull().default(false),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    providerId: text('provider_id'),
  },
  (t) => [uniqueIndex('send_recipients_send_contact_uidx').on(t.sendId, t.contactId)],
)

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  contactId: uuid('contact_id')
    .notNull()
    .references(() => contacts.id, { onDelete: 'no action' }), // deferred to commit: migration 0009
  sendId: uuid('send_id')
    .notNull()
    .references(() => sends.id, { onDelete: 'cascade' }),
  kind: eventKindEnum('kind').notNull(),
  section: text('section'),
  createdAt: createdAt(),
})

export const subscriptions = pgTable('subscriptions', {
  accountId: uuid('account_id')
    .primaryKey()
    .references(() => accounts.id, { onDelete: 'no action' }),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubId: text('stripe_sub_id'),
  plan: text('plan').notNull(),
  status: text('status').notNull(),
})

export const accountAddons = pgTable(
  'account_addons',
  {
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    addonKey: text('addon_key').notNull(),
    enabled: boolean('enabled').notNull().default(false),
    config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
    enabledAt: timestamp('enabled_at', { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.addonKey] })],
)

export const adminActions = pgTable('admin_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminAccountId: uuid('admin_account_id').references(() => accounts.id, { onDelete: 'set null' }),
  // An audit log that deletes itself with the thing it audited is not an audit log.
  targetAccountId: uuid('target_account_id').references(() => accounts.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  detail: jsonb('detail').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
})

export const contactMatchCandidates = pgTable(
  'contact_match_candidates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    parcelId: uuid('parcel_id')
      .notNull()
      .references(() => parcels.id, { onDelete: 'cascade' }),
    confidence: doublePrecision('confidence').notNull(),
    reason: text('reason').notNull(),
    rank: integer('rank').notNull(),
  },
  (t) => [
    uniqueIndex('contact_match_candidates_contact_parcel_uidx').on(
      t.contactId,
      t.parcelId,
    ),
  ],
)

export { jobs } from './schema-jobs'
export { mailEvents } from './schema-mail'
