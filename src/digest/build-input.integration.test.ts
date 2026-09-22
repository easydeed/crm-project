import { randomUUID } from 'node:crypto'
import { inArray } from 'drizzle-orm'
import { afterAll, describe, expect, test } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import { withStreetNameNorm } from '@/db/parcel-write'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, contacts, parcelEvents, parcels } from '@/db/schema'
import { AS_OF } from '@/digest/fixtures/scenarios'
import { buildDigestInput } from '@/digest/build-input'
import { DEED_OF_TRUST, GRANT_DEED } from '@/digest/types'

const sessionUrl = tryLoadIntegrationDatabaseUrl()
const accountIds: string[] = []
const parcelIds: string[] = []

async function newAccount(name = 'Preview Tester') {
  const created = await registerAccount({
    name,
    email: `or011-${randomUUID()}@example.com`,
    password: 'long-enough-password',
    brokerage: 'Coastline Realty',
    dre: '01998432',
    phone: '909-555-0147',
  })
  expect(created.ok).toBe(true)
  if (!created.ok) throw new Error('register failed')
  accountIds.push(created.accountId)
  return created.accountId
}

async function insertParcel(extra?: {
  address?: string
  zip?: string
  assessedValue?: number
  useCode?: string
}) {
  const { db } = getRuntimeDb()
  const id = randomUUID()
  await db.insert(parcels).values(
    withStreetNameNorm({
      id,
      apn: `OR011-${id.slice(0, 8)}`,
      county: 'Los Angeles',
      address: extra?.address ?? '1142 Oakdale Ave',
      city: 'La Verne',
      zip: extra?.zip ?? '91750',
      beds: 3,
      baths: '2.0',
      sqft: 1680,
      useCode: extra?.useCode ?? 'SFR',
      assessedValue: extra?.assessedValue ?? 425000,
    }),
  )
  parcelIds.push(id)
  return id
}

async function insertEvent(
  parcelId: string,
  extra: {
    kind?: string
    docNumber: string
    recordedAt: string
    amount?: number | null
    party?: string
  },
) {
  const { db } = getRuntimeDb()
  await db.insert(parcelEvents).values({
    id: randomUUID(),
    parcelId,
    county: 'Los Angeles',
    kind: extra.kind ?? GRANT_DEED,
    docNumber: extra.docNumber,
    recordedAt: extra.recordedAt,
    amount: extra.amount ?? null,
    party: extra.party ?? 'Neighbor',
    raw: {},
  })
}

async function insertPerson(
  accountId: string,
  extra: {
    name?: string
    parcelId?: string | null
    status?: 'matched' | 'needs_review' | 'no_parcel'
    closeDate?: string
  },
) {
  const { db } = getRuntimeDb()
  const id = randomUUID()
  await db.insert(contacts).values({
    id,
    accountId,
    name: extra.name ?? 'Marilyn Cole',
    email: `marilyn-${id.slice(0, 8)}@example.com`,
    addressRaw: '1142 Oakdale Ave, La Verne, CA 91750',
    closeDate: extra.closeDate ?? '2019-04-20',
    status: extra.status ?? (extra.parcelId ? 'matched' : 'no_parcel'),
    parcelId: extra.parcelId ?? null,
  })
  return id
}

describe.skipIf(!sessionUrl)('buildDigestInput', { timeout: 120_000 }, () => {
  afterAll(async () => {
    if (!sessionUrl) return
    const { db } = getRuntimeDb()
    if (accountIds.length) {
      await db.delete(contacts).where(inArray(contacts.accountId, accountIds))
      await db.delete(accounts).where(inArray(accounts.id, accountIds))
    }
    if (parcelIds.length) {
      await db.delete(parcelEvents).where(inArray(parcelEvents.parcelId, parcelIds))
      await db.delete(parcels).where(inArray(parcels.id, parcelIds))
    }
  })

  test('assembles one digest and ignores other-account or unmatched contacts', async () => {
    const accountId = await newAccount()
    const otherId = await newAccount('Other Agent')
    const zip = `91${accountId.replace(/\D/g, '').slice(0, 3)}`
    const street = `Oakprev ${accountId.slice(0, 8)} Ave`
    const subject = await insertParcel({ address: `1142 ${street}`, zip })
    const neighborA = await insertParcel({ address: `1840 ${street}`, zip })
    const neighborB = await insertParcel({ address: `1852 ${street}`, zip })
    const otherStreet = await insertParcel({
      address: `100 Other ${accountId.slice(0, 6)} Rd`,
      zip,
    })
    const otherZip = await insertParcel({
      address: `200 ${street}`,
      zip: `92${accountId.replace(/\D/g, '').slice(0, 3)}`,
    })

    await insertEvent(subject, {
      docNumber: `GD-${accountId.slice(0, 8)}`,
      recordedAt: '2019-04-15',
      amount: 720000,
      party: 'Marilyn Cole',
    })
    await insertEvent(subject, {
      kind: DEED_OF_TRUST,
      docNumber: `DT-${accountId.slice(0, 8)}`,
      recordedAt: '2019-04-20',
      amount: 500000,
      party: 'Coastline Mortgage',
    })
    await insertEvent(neighborA, {
      docNumber: `SA-${accountId.slice(0, 8)}`,
      recordedAt: '2025-11-08',
      amount: 980000,
      party: 'Luis Ortega',
    })
    await insertEvent(neighborB, {
      docNumber: `SB-${accountId.slice(0, 8)}`,
      recordedAt: '2026-03-21',
      amount: 1040000,
      party: 'Elena Vasquez',
    })
    await insertEvent(neighborA, {
      docNumber: `OLD-${accountId.slice(0, 8)}`,
      recordedAt: '2024-05-14',
      amount: 875000,
      party: 'Old Sale',
    })
    await insertEvent(otherStreet, {
      docNumber: `OS-${accountId.slice(0, 8)}`,
      recordedAt: '2026-05-14',
      amount: 1100000,
    })
    await insertEvent(otherZip, {
      docNumber: `OZ-${accountId.slice(0, 8)}`,
      recordedAt: '2026-05-14',
      amount: 1100000,
    })

    const contactId = await insertPerson(accountId, {
      parcelId: subject,
      status: 'matched',
    })
    const unmatchedId = await insertPerson(accountId, {
      name: 'Helen Cho',
      status: 'no_parcel',
    })

    const { db } = getRuntimeDb()
    const input = await buildDigestInput(db, accountId, contactId, AS_OF)
    expect(input).not.toBeNull()
    if (!input) return
    expect(input.contact.firstName).toBe('Marilyn')
    expect(input.contact.closeDate).toBe('2019-04-20')
    expect(input.parcel.address).toBe(`1142 ${street}`)
    expect(input.events).toHaveLength(2)
    expect(input.streetSales.map((sale) => sale.docNumber).sort()).toEqual([
      `SA-${accountId.slice(0, 8)}`,
      `SB-${accountId.slice(0, 8)}`,
    ].sort())
    expect(input.nearbyListing).toBeNull()
    expect(input.agent.brokerage).toBe('Coastline Realty')

    expect(await buildDigestInput(db, otherId, contactId, AS_OF)).toBeNull()
    expect(await buildDigestInput(db, accountId, unmatchedId, AS_OF)).toBeNull()
    expect(await buildDigestInput(db, accountId, randomUUID(), AS_OF)).toBeNull()
  })
})
