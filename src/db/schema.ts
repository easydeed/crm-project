import { sql } from 'drizzle-orm'
import {
  boolean,
  date,
  doublePrecision,
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
export const contactStatusEnum = pgEnum('contact_status', [
  'matched',
  'needs_review',
  'no_parcel',
])
export const subscriptionScopeEnum = pgEnum('subscription_scope', [
  'monthly',
  'weekly',
])
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
  (t) => [uniqueIndex('parcels_county_apn_uidx').on(t.county, t.apn)],
)

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    addressRaw: text('address_raw').notNull(),
    parcelId: uuid('parcel_id').references(() => parcels.id),
    closeDate: date('close_date'),
    notes: text('notes'),
    status: contactStatusEnum('status').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('contacts_account_email_uidx').on(
      t.accountId,
      sql`lower(${t.email})`,
    ),
  ],
)

export const contactSubscriptions = pgTable(
  'contact_subscriptions',
  {
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id),
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
      .references(() => accounts.id),
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
      .references(() => parcels.id),
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

export const sends = pgTable('sends', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  state: text('state').notNull(),
  createdAt: createdAt(),
})

export const sendRecipients = pgTable(
  'send_recipients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sendId: uuid('send_id')
      .notNull()
      .references(() => sends.id),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id),
    html: text('html'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    providerId: text('provider_id'),
  },
  (t) => [uniqueIndex('send_recipients_send_contact_uidx').on(t.sendId, t.contactId)],
)

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  contactId: uuid('contact_id')
    .notNull()
    .references(() => contacts.id),
  sendId: uuid('send_id')
    .notNull()
    .references(() => sends.id),
  kind: eventKindEnum('kind').notNull(),
  section: text('section'),
  createdAt: createdAt(),
})

export const subscriptions = pgTable('subscriptions', {
  accountId: uuid('account_id')
    .primaryKey()
    .references(() => accounts.id),
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
      .references(() => accounts.id),
    addonKey: text('addon_key').notNull(),
    enabled: boolean('enabled').notNull().default(false),
    config: jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
    enabledAt: timestamp('enabled_at', { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.addonKey] })],
)

export const adminActions = pgTable('admin_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminAccountId: uuid('admin_account_id')
    .notNull()
    .references(() => accounts.id),
  targetAccountId: uuid('target_account_id')
    .notNull()
    .references(() => accounts.id),
  action: text('action').notNull(),
  detail: jsonb('detail').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
})

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  kind: text('kind').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
  runAfter: timestamp('run_after', { withTimezone: true }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  error: text('error'),
})
