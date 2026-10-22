import { and, eq, sql } from 'drizzle-orm'
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { auditFixtures, AUDIT_NOW } from '@/test/audit-fixtures'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, jobs, subscriptions } from '@/db/schema'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { FakeBillingGateway } from '@/billing/fake-gateway'
import { StripeGateway } from '@/billing/stripe-gateway'
import { getBillingGateway, setBillingGateway } from '@/billing/current'
import { switchAddonOn } from '@/addons/state'
import { TEXT_CALL_LIST_KEY as KEY } from '@/addons/text-call-list'
import { queueStopRecovery, loadStopRecovery } from '@/text/stop-state'
import { processClaimedJob, type ClaimedJob } from '@/jobs/run'
import { loadTextNotice } from '@/text/text-notice'
import { stopTexting } from '@/text/text-facts'

describe.skipIf(!tryLoadIntegrationDatabaseUrl())('OR-056 terminal STOP recovery', () => {
  const fixtures = auditFixtures(), env = { ...process.env }
  beforeEach(() => { delete process.env.ONRECORD_E2E; delete process.env.ONRECORD_DEMO; setBillingGateway(new FakeBillingGateway()) })
  afterEach(() => vi.restoreAllMocks())
  afterAll(async () => { await fixtures.cleanup(); process.env = env; setBillingGateway(new StripeGateway()) })
  async function exhausted() {
    const home = await fixtures.household()
    const { db } = getRuntimeDb()
    await db.update(accounts).set({ phoneVerifiedAt: AUDIT_NOW }).where(eq(accounts.id, home.accountId))
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(true)
    const fake = getBillingGateway() as FakeBillingGateway
    const fail = vi.spyOn(fake, 'setMonthlyTotal').mockRejectedValue(new Error('Stripe unavailable'))
    const id = await queueStopRecovery(home.accountId)
    for (let attempt = 1; attempt <= 4; attempt++) {
      await db.update(jobs).set({ attempts: attempt }).where(eq(jobs.id, id))
      const [row] = await db.select().from(jobs).where(eq(jobs.id, id))
      await processClaimedJob({ ...row, attempts: attempt } as ClaimedJob)
    }
    return { ...home, id, fake, fail }
  }
  test('four failed attempts finish the job and replace pending with an actionable failure', async () => {
    const home = await exhausted()
    const [job] = await getRuntimeDb().db.select().from(jobs).where(eq(jobs.id, home.id))
    expect(job.completedAt).toBeInstanceOf(Date)
    expect(job.error).toBeTruthy()
    expect(await loadStopRecovery(home.accountId)).toBe('failed')
    expect(await loadTextNotice(home.accountId)).toBe('billing_failed')
    const [sub] = await getRuntimeDb().db.select().from(subscriptions).where(eq(subscriptions.accountId, home.accountId))
    expect((await home.fake.getSubscription(sub.stripeSubId!)).addonKeys).toContain(KEY)
  })
  test('a new STOP starts a fresh retry budget instead of reusing the exhausted job', async () => {
    const home = await exhausted()
    await expect(stopTexting(getRuntimeDb().db, home.accountId, '+19095550147', 'stop_received', AUDIT_NOW)).rejects.toThrow(/switch-off failed/)
    const rows = await getRuntimeDb().db.select().from(jobs).where(and(eq(jobs.kind, 'stop_texting'), sql`${jobs.payload}->>'accountId' = ${home.accountId}`))
    const fresh = rows.find((row) => row.id !== home.id)
    expect(fresh).toMatchObject({ attempts: 0, completedAt: null, error: null })
    expect(await queueStopRecovery(home.accountId)).toBe(fresh!.id)
    expect(await loadStopRecovery(home.accountId)).toBe('pending')
  })
  test('confirmed re-enable clears exhausted and queued recovery receipts', async () => {
    const home = await exhausted()
    const fresh = await queueStopRecovery(home.accountId)
    home.fail.mockRestore()
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(true)
    expect(await loadStopRecovery(home.accountId)).toBeNull()
    expect(await loadTextNotice(home.accountId)).toBeNull()
    const [row] = await getRuntimeDb().db.select().from(jobs).where(eq(jobs.id, fresh))
    expect(row.completedAt).toBeInstanceOf(Date)
    expect(row.error).toBeNull()
  })
})
