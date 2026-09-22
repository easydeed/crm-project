import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, describe, expect, test } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { createDb } from '@/db/client'
import { reviewContacts, reviewParcels } from '@/db/fixtures/la-verne-review'
import { withStreetNameNorm } from '@/db/parcel-write'
import { persistReviewCandidates } from '@/db/persist-review-candidates'
import {
  accounts,
  contactMatchCandidates,
  contacts,
  parcels,
} from '@/db/schema'
import { findCandidateParcels } from '@/matching/candidates'
import { parseAddress } from '@/matching/normalize'

const VOLUME_ZIP = '88881'
const VOLUME_CITY = 'Temecula'
const TARGET_APN = 'VOL-88881-TARGET'
const TARGET_ADDRESS = '4721 Oakdale Ave'

const sessionUrl = tryLoadIntegrationDatabaseUrl()

const handle = sessionUrl ? createDb(sessionUrl) : null
const accountIds: string[] = []
const parcelIds: string[] = []

function db() {
  if (!handle) throw new Error('DATABASE_URL is not set')
  return handle.db
}

function client() {
  if (!handle) throw new Error('DATABASE_URL is not set')
  return handle.client
}

function planText(explained: unknown) {
  return JSON.stringify(explained)
}

function executionMs(explained: unknown) {
  const match = JSON.stringify(explained).match(/"Execution Time":\s*([0-9.]+)/)
  return match ? Number(match[1]) : null
}

const MESSY_VARIANTS = [
  '4721 Oakdale Ave, Temecula, CA 88881',
  '4721 Oakdale Avenue, Temecula, CA 88881',
  '4721 Oak Dale Ave, Temecula, CA 88881',
  '4721 oakdale ave, temecula, ca 88881',
  '4721 OAKDALE AV, TEMECULA, CA 88881',
  '4721 Oakdale, Temecula, CA 88881',
  '4721 Oakdlae Ave, Temecula, CA 88881',
]

describe.skipIf(!sessionUrl)('OR-005a candidate retrieval', { timeout: 180_000 }, () => {
  afterAll(async () => {
    if (!handle) return
    await handle.db.delete(parcels).where(eq(parcels.zip, VOLUME_ZIP))
    if (accountIds.length) {
      await handle.db.delete(contacts).where(inArray(contacts.accountId, accountIds))
      await handle.db.delete(accounts).where(inArray(accounts.id, accountIds))
    }
    if (parcelIds.length) {
      await handle.db.delete(parcels).where(inArray(parcels.id, parcelIds))
    }
    await handle.client.end({ timeout: 2 })
  })

  test('never returns a ZIP-only set and finds the 10k target', async () => {
    await client().unsafe(`delete from parcels where zip = '${VOLUME_ZIP}'`)
    await client().unsafe(`
      insert into parcels (apn, county, address, city, zip, street_name_norm)
      select
        'VOL-88881-F' || lpad(i::text, 5, '0'),
        'Riverside',
        (10000 + i)::text || ' Filler Rd',
        '${VOLUME_CITY}',
        '${VOLUME_ZIP}',
        'filler'
      from generate_series(1, 9800) as i
    `)
    await client().unsafe(`
      insert into parcels (apn, county, address, city, zip, street_name_norm)
      select
        'VOL-88881-OA' || lpad(i::text, 2, '0'),
        'Riverside',
        (4000 + i * 2)::text || ' Oakdale Ave',
        '${VOLUME_CITY}',
        '${VOLUME_ZIP}',
        'oakdale'
      from generate_series(0, 38) as i
    `)
    await db().insert(parcels).values(
      withStreetNameNorm({
        apn: TARGET_APN,
        county: 'Riverside',
        address: TARGET_ADDRESS,
        city: VOLUME_CITY,
        zip: VOLUME_ZIP,
      }),
    )
    await client().unsafe(`
      insert into parcels (apn, county, address, city, zip, street_name_norm)
      select * from (
        select 'VOL-88881-OC' || lpad(i::text, 2, '0'), 'Riverside',
          (5000 + i)::text || ' Oakdale Ct', '${VOLUME_CITY}', '${VOLUME_ZIP}', 'oakdale'
        from generate_series(1, 40) as i
        union all
        select 'VOL-88881-OD' || lpad(i::text, 2, '0'), 'Riverside',
          (6000 + i)::text || ' Oak Dale Dr', '${VOLUME_CITY}', '${VOLUME_ZIP}', 'oak dale'
        from generate_series(1, 40) as i
        union all
        select 'VOL-88881-OL' || lpad(i::text, 2, '0'), 'Riverside',
          (7000 + i)::text || ' Oakland Ave', '${VOLUME_CITY}', '${VOLUME_ZIP}', 'oakland'
        from generate_series(1, 40) as i
        union all
        select 'VOL-88881-OW' || lpad(i::text, 2, '0'), 'Riverside',
          (8000 + i)::text || ' Oakwood Ave', '${VOLUME_CITY}', '${VOLUME_ZIP}', 'oakwood'
        from generate_series(1, 40) as i
      ) as lookalikes
    `)

    const [{ count }] = await client()`
      select count(*)::int as count from parcels where zip = ${VOLUME_ZIP}
    `
    expect(count).toBe(10000)
    await client().unsafe('analyze parcels')

    const queryTimes: number[] = []
    for (const raw of MESSY_VARIANTS) {
      const normalized = parseAddress(raw)
      expect(normalized, raw).toBeTruthy()
      if (!normalized) throw new Error(raw)
      const started = Date.now()
      const found = await findCandidateParcels(db(), normalized)
      const elapsed = Date.now() - started
      queryTimes.push(elapsed)
      expect(found.length, raw).toBeGreaterThan(0)
      expect(found.length, raw).toBeLessThanOrEqual(50)
      expect(
        found.every((row) => !/filler/i.test(row.address)),
        raw,
      ).toBe(true)
      expect(
        found.some((row) => row.apn === TARGET_APN),
        raw,
      ).toBe(true)
    }

    await client().unsafe('set enable_seqscan = off')
    const exactPlan = await client().unsafe(
      `explain (analyze, format json)
       select id from parcels
       where zip = '${VOLUME_ZIP}' and street_name_norm = 'oakdale'
       limit 50`,
    )
    const fuzzyPlan = await client().unsafe(
      `explain (analyze, format json)
       select id from parcels
       where street_name_norm % 'oakdlae'
       limit 50`,
    )
    const retrievalPlan = await client().unsafe(
      `explain (analyze, format json)
       select id from parcels
       where zip = '${VOLUME_ZIP}'
         and (
           street_name_norm = 'oakdale'
           or street_name_norm % 'oakdale'
           or similarity(street_name_norm, 'oakdale') >= 0.2
         )
       order by
         case when address ilike '4721 %' then 0 else 1 end,
         greatest(
           case when street_name_norm = 'oakdale' then 1 else 0 end,
           similarity(street_name_norm, 'oakdale')
         ) desc
       limit 50`,
    )
    await client().unsafe('set enable_seqscan = on')

    const exactText = planText(exactPlan)
    const fuzzyText = planText(fuzzyPlan)
    const retrievalText = planText(retrievalPlan)
    console.log(`EXPLAIN exact: ${exactText}`)
    console.log(`EXPLAIN fuzzy: ${fuzzyText}`)
    console.log(`EXPLAIN retrieval: ${retrievalText}`)
    expect(exactText).toMatch(/parcels_zip_street_name_norm_idx/)
    expect(fuzzyText).toMatch(/parcels_street_name_norm_trgm_idx/)

    const retrievalMs = executionMs(retrievalPlan)
    const clientMax = Math.max(...queryTimes)
    console.log(
      `10k retrieval clientMs=${queryTimes.join(',')} max=${clientMax} explainRetrievalMs=${retrievalMs}`,
    )
    expect(retrievalMs).toBeTruthy()
    expect(retrievalMs as number).toBeLessThan(50)
  })

  test('review path persists 2-3 candidates for four contacts', async () => {
    const isolatedZip = '88882'
    const isolated = reviewParcels.map((row) =>
      withStreetNameNorm({
        ...row,
        id: randomUUID(),
        apn: `OR005A-${randomUUID().slice(0, 8)}`,
        zip: isolatedZip,
      }),
    )
    await db().insert(parcels).values(isolated)
    parcelIds.push(...isolated.map((row) => row.id))

    const created = await registerAccount({
      name: 'Review Seed',
      email: `or005a-${randomUUID()}@example.com`,
      password: 'long-enough-password',
      brokerage: 'Coastline',
      dre: '01234567',
      phone: '909-555-0100',
    })
    expect(created.ok).toBe(true)
    if (!created.ok) throw new Error('register failed')
    accountIds.push(created.accountId)

    const seeded = reviewContacts.map((contact) => ({
      ...contact,
      id: randomUUID(),
      accountId: created.accountId,
      addressRaw: contact.addressRaw.replace('CA 91750', `CA ${isolatedZip}`),
    }))
    await db().insert(contacts).values(seeded)
    await persistReviewCandidates(db(), seeded)

    for (const contact of seeded) {
      const stored = await db()
        .select()
        .from(contactMatchCandidates)
        .where(eq(contactMatchCandidates.contactId, contact.id))
      expect(stored.length, contact.name).toBeGreaterThanOrEqual(2)
      expect(stored.length, contact.name).toBeLessThanOrEqual(3)
    }
  })
})
