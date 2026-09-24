import { randomUUID } from 'node:crypto'
import { eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { withStreetNameNorm } from '@/db/parcel-write'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import {
  accountAddons, accounts, adminActions, contactMatchCandidates, contactSubscriptions, contacts,
  events, groupMembers, groups, parcels, sendRecipients, sends,
} from '@/db/schema'
import { callListEntries, callLog } from '@/db/schema-call-lists'

const databaseUrl = tryLoadIntegrationDatabaseUrl()

/** The ON DELETE rule of every foreign key, as decided in the OR-006a phase-one table. */
const EXPECTED: Record<string, string> = {
  contacts_account_id_accounts_id_fk: 'cascade',
  groups_account_id_accounts_id_fk: 'cascade',
  sends_account_id_accounts_id_fk: 'cascade',
  subscriptions_account_id_accounts_id_fk: 'no action',
  account_addons_account_id_accounts_id_fk: 'cascade',
  call_list_entries_account_id_accounts_id_fk: 'cascade',
  call_log_account_id_accounts_id_fk: 'cascade',
  admin_actions_admin_account_id_accounts_id_fk: 'set null',
  admin_actions_target_account_id_accounts_id_fk: 'set null',
  contact_subscriptions_contact_id_contacts_id_fk: 'cascade',
  group_members_contact_id_contacts_id_fk: 'cascade',
  contact_match_candidates_contact_id_contacts_id_fk: 'cascade',
  call_list_entries_contact_id_contacts_id_fk: 'cascade',
  call_log_contact_id_contacts_id_fk: 'cascade',
  send_recipients_contact_id_contacts_id_fk: 'no action, deferred',
  events_contact_id_contacts_id_fk: 'no action, deferred',
  send_recipients_send_id_sends_id_fk: 'cascade',
  events_send_id_sends_id_fk: 'cascade',
  group_members_group_id_groups_id_fk: 'cascade',
  contacts_parcel_id_parcels_id_fk: 'restrict',
  parcel_events_parcel_id_parcels_id_fk: 'cascade',
  contact_match_candidates_parcel_id_parcels_id_fk: 'cascade',
}

describe.skipIf(!databaseUrl)('OR-006a foreign keys and account deletion', () => {
  const parcelIds: string[] = []
  const accountIds: string[] = []

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
  })

  afterAll(async () => {
    const { db, client } = getRuntimeDb()
    await db.delete(adminActions).where(inArray(adminActions.adminAccountId, accountIds))
    await db.delete(accounts).where(inArray(accounts.id, accountIds))
    await db.delete(parcels).where(inArray(parcels.id, parcelIds))
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  async function account(label: string) {
    const created = await registerAccount({ name: `OR006a ${label}`, email: `or006a-del-${label}-${randomUUID()}@example.com`, password: 'long-enough-password', brokerage: 'Hill Realty', dre: '02000602', phone: '909-555-0162' })
    if (!created.ok) throw new Error('could not register')
    accountIds.push(created.accountId)
    return created.accountId
  }

  test('every foreign key has the ON DELETE rule the phase-one table decided', async () => {
    const rows = await getRuntimeDb().db.execute<{ name: string; rule: string; deferred: boolean }>(sql`
      select con.conname as name, con.condeferred as deferred,
        case con.confdeltype when 'c' then 'cascade' when 'n' then 'set null' when 'r' then 'restrict'
          when 'a' then 'no action' when 'd' then 'set default' end as rule
      from pg_constraint con join pg_namespace ns on ns.oid = con.connamespace
      where con.contype = 'f' and ns.nspname = 'public'`)
    const actual = Object.fromEntries(rows.map((r) => [r.name, r.deferred ? `${r.rule}, deferred` : r.rule]))
    expect(actual).toEqual(EXPECTED)
  })

  test('deleting an account removes everything it owns; the audit log survives it', async () => {
    const accountId = await account('owner')
    const adminId = await account('admin')
    const { db } = getRuntimeDb()
    const parcelId = randomUUID()
    parcelIds.push(parcelId)
    await db.insert(parcels).values(withStreetNameNorm({ id: parcelId, apn: `OR006AD-${parcelId.slice(0, 8)}`, county: 'Los Angeles', address: '1 Gone Way', city: 'La Verne', zip: '91750' }))
    const [live, soft] = [randomUUID(), randomUUID()]
    await db.insert(contacts).values([
      { id: live, accountId, name: 'Live', email: `l-${live.slice(0, 8)}@example.com`, addressRaw: 'x', parcelId, status: 'matched' },
      { id: soft, accountId, name: 'Soft', email: `s-${soft.slice(0, 8)}@example.com`, addressRaw: 'x', status: 'no_parcel', deletedAt: new Date() },
    ])
    const [group] = await db.insert(groups).values({ accountId, name: 'Neighbors' }).returning()
    await db.insert(groupMembers).values({ groupId: group!.id, contactId: live })
    await db.insert(contactMatchCandidates).values({ contactId: soft, parcelId, confidence: 0.5, reason: 'x', rank: 1 })
    const [send] = await db.insert(sends).values({ accountId, scheduledFor: new Date(), state: 'done' }).returning()
    await db.insert(sendRecipients).values([{ sendId: send!.id, contactId: live, html: '<p>x</p>', sentAt: new Date() }, { sendId: send!.id, contactId: soft }])
    await db.insert(events).values({ contactId: soft, sendId: send!.id, kind: 'opened' })
    await db.insert(callListEntries).values({ accountId, contactId: live, kind: 'quiet_a_while', detail: 'x', score: 30, period: '2026-09' })
    await db.insert(callLog).values({ accountId, contactId: live, kind: 'quiet_a_while', period: '2026-09', outcome: 'called' })
    await db.insert(accountAddons).values({ accountId, addonKey: 'text_call_list' })
    const [audit] = await db.insert(adminActions).values({ adminAccountId: adminId, targetAccountId: accountId, action: 'view_as' }).returning()

    // A contact alone cannot be hard-deleted while it has send history (checked at commit).
    const refused = await db.delete(contacts).where(eq(contacts.id, live)).then(() => null, (err: { cause?: { constraint_name?: string } }) => err)
    expect(refused?.cause?.constraint_name).toBe('send_recipients_contact_id_contacts_id_fk')
    await db.delete(accounts).where(eq(accounts.id, accountId))

    const ids = [live, soft]
    const counts = {
      contacts: await db.select().from(contacts).where(eq(contacts.accountId, accountId)),
      subscriptions: await db.select().from(contactSubscriptions).where(inArray(contactSubscriptions.contactId, ids)),
      groups: await db.select().from(groups).where(eq(groups.accountId, accountId)),
      members: await db.select().from(groupMembers).where(eq(groupMembers.groupId, group!.id)),
      candidates: await db.select().from(contactMatchCandidates).where(inArray(contactMatchCandidates.contactId, ids)),
      sends: await db.select().from(sends).where(eq(sends.accountId, accountId)),
      recipients: await db.select().from(sendRecipients).where(eq(sendRecipients.sendId, send!.id)),
      events: await db.select().from(events).where(eq(events.sendId, send!.id)),
      callList: await db.select().from(callListEntries).where(eq(callListEntries.accountId, accountId)),
      callLog: await db.select().from(callLog).where(eq(callLog.accountId, accountId)),
      addons: await db.select().from(accountAddons).where(eq(accountAddons.accountId, accountId)),
    }
    for (const [table, rows] of Object.entries(counts)) expect(rows, table).toHaveLength(0)
    const [kept] = await db.select().from(adminActions).where(eq(adminActions.id, audit!.id))
    expect(kept).toMatchObject({ adminAccountId: adminId, targetAccountId: null, action: 'view_as' })
    expect(await db.select().from(parcels).where(eq(parcels.id, parcelId))).toHaveLength(1)
  })
})
