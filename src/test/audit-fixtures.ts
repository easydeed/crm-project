import { randomUUID } from 'node:crypto'
import { inArray, sql } from 'drizzle-orm'
import { registerAccount } from '@/auth/register-account'
import { giveActiveSubscription } from '@/billing/subscription-fixture'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, jobs, parcelEvents, parcels, sendRecipients, sends, subscriptions } from '@/db/schema'
import { contactsTable } from '@/db/live-contacts'
import { withStreetNameNorm } from '@/db/parcel-write'

export const AUDIT_NOW = new Date('2026-10-21T18:00:00Z')
export const AUDIT_CONTEXT = { jobId: 'OR-055', attempt: 1, now: AUDIT_NOW }

export function auditFixtures() {
  const accountIds: string[] = []
  const parcelIds: string[] = []
  return {
    async household() {
      const result = await registerAccount({ name: 'Audit Agent', email: `audit-${randomUUID()}@example.com`, password: 'audit-password-only', brokerage: 'Fixture Realty', dre: '01234567', phone: '9095550147' })
      if (!result.ok) throw new Error('Could not create audit account')
      const accountId = result.accountId
      accountIds.push(accountId)
      await giveActiveSubscription(accountId)
      const { db } = getRuntimeDb()
      const parcelId = randomUUID()
      const neighborId = randomUUID()
      const street = `Audit ${accountId.slice(0, 8)} Ave`
      await db.insert(parcels).values([parcelId, neighborId].map((id, index) => withStreetNameNorm({ id, apn: id, county: 'Los Angeles', address: `${1142 + index * 2} ${street}`, city: 'La Verne', zip: '91750', assessedValue: 280000, useCode: 'SFR' })))
      parcelIds.push(parcelId, neighborId)
      await db.insert(parcelEvents).values({ parcelId: neighborId, county: 'Los Angeles', kind: 'grant_deed', docNumber: randomUUID(), recordedAt: '2026-10-01', amount: 1000000 })
      const [contact] = await db.insert(contactsTable).values({ accountId, name: 'Audit Homeowner', email: `home-${accountId}@example.com`, addressRaw: `1142 ${street}, La Verne, CA 91750`, parcelId, status: 'matched', closeDate: '2019-03-14' }).returning()
      const [send] = await db.insert(sends).values({ accountId, scheduledFor: AUDIT_NOW, state: 'scheduled' }).returning()
      return { accountId, contact, parcelId, neighborId, sendId: send.id, street }
    },
    async cleanup() {
      if (!accountIds.length) return
      const { db } = getRuntimeDb()
      const sendRows = await db.select({ id: sends.id }).from(sends).where(inArray(sends.accountId, accountIds))
      if (sendRows.length) {
        await db.delete(jobs).where(inArray(sql`${jobs.payload}->>'sendId'`, sendRows.map((row) => row.id)))
        await db.delete(sendRecipients).where(inArray(sendRecipients.sendId, sendRows.map((row) => row.id)))
        await db.delete(sends).where(inArray(sends.id, sendRows.map((row) => row.id)))
      }
      await db.delete(jobs).where(sql`${jobs.payload}->>'accountId' in (${sql.join(accountIds.map((id) => sql`${id}`), sql`, `)})`)
      await db.delete(subscriptions).where(inArray(subscriptions.accountId, accountIds))
      await db.delete(accounts).where(inArray(accounts.id, accountIds))
      await db.delete(parcels).where(inArray(parcels.id, parcelIds))
    },
  }
}
