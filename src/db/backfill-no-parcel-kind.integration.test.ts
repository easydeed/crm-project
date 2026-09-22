import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, describe, expect, test } from 'vitest'
import { matchingRates } from '@/admin/matching-rates'
import { registerAccount } from '@/auth/register-account'
import { backfillNoParcelKind } from '@/db/backfill-no-parcel-kind'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, contacts } from '@/db/schema'
import { noParcelKindFor } from '@/matching/no-parcel-kind'

const sessionUrl = tryLoadIntegrationDatabaseUrl()
const accountIds: string[] = []
const LA_VERNE_PO_BOX = 'PO Box 312, La Verne, CA 91750'

describe.skipIf(!sessionUrl)('OR-008a no_parcel_kind backfill', { timeout: 120_000 }, () => {
  afterAll(async () => {
    if (!sessionUrl || !accountIds.length) return
    const { db } = getRuntimeDb()
    await db.delete(contacts).where(inArray(contacts.accountId, accountIds))
    await db.delete(accounts).where(inArray(accounts.id, accountIds))
  })

  test('La Verne PO Box is not_an_address and drops out of auto-match', async () => {
    const created = await registerAccount({
      name: 'Backfill Tester',
      email: `or008a-${randomUUID()}@example.com`,
      password: 'long-enough-password',
      brokerage: 'Coastline',
      dre: '01234567',
      phone: '909-555-0100',
    })
    expect(created.ok).toBe(true)
    if (!created.ok) throw new Error('register failed')
    accountIds.push(created.accountId)

    const { db } = getRuntimeDb()
    const boxId = randomUUID()
    const streetId = randomUUID()
    await db.insert(contacts).values([
      {
        id: boxId,
        accountId: created.accountId,
        name: 'Helen Box',
        email: `box-${boxId.slice(0, 8)}@example.com`,
        addressRaw: LA_VERNE_PO_BOX,
        status: 'no_parcel',
        matchSource: 'auto',
        noParcelKind: null,
      },
      {
        id: streetId,
        accountId: created.accountId,
        name: 'Street Match',
        email: `street-${streetId.slice(0, 8)}@example.com`,
        addressRaw: '1142 Oakdale Ave, La Verne, CA 91750',
        status: 'matched',
        matchSource: 'auto',
      },
    ])

    const before = await db.select().from(contacts).where(eq(contacts.id, boxId))
    expect(before[0]?.status).toBe('no_parcel')
    expect(before[0]?.parcelId).toBeNull()
    expect(before[0]?.noParcelKind).toBeNull()

    const result = await backfillNoParcelKind(db, [boxId, streetId])
    expect(result.total).toBe(1)
    expect(result.updated).toBe(1)

    const after = await db.select().from(contacts).where(eq(contacts.id, boxId))
    const kind = noParcelKindFor('no_parcel', LA_VERNE_PO_BOX)
    expect(kind).toBe('non_address')
    expect(after[0]?.noParcelKind).toBe(kind)
    expect(after[0]?.status).toBe('no_parcel')
    expect(after[0]?.parcelId).toBeNull()

    const street = await db.select().from(contacts).where(eq(contacts.id, streetId))
    expect(street[0]?.status).toBe('matched')
    expect(street[0]?.noParcelKind).toBeNull()

    const rates = matchingRates([
      {
        status: after[0]!.status,
        matchSource: after[0]!.matchSource,
        noParcelKind: after[0]!.noParcelKind,
      },
      {
        status: street[0]!.status,
        matchSource: street[0]!.matchSource,
        noParcelKind: street[0]!.noParcelKind,
      },
    ])
    expect(rates.street).toBe(1)
    expect(rates.autoMatched).toBe(1)
    expect(rates.autoMatchRate).toBe(1)
  })
})
