import { and, eq, isNull, sql } from 'drizzle-orm'
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { auditFixtures, AUDIT_CONTEXT as ctx, AUDIT_NOW } from '@/test/audit-fixtures'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, jobs, subscriptions } from '@/db/schema'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { FakeBillingGateway } from '@/billing/fake-gateway'
import { StripeGateway } from '@/billing/stripe-gateway'
import { getBillingGateway, setBillingGateway } from '@/billing/current'
import { startCheckout } from '@/billing/account-billing'
import { isAddonEnabled, loadAddonStates, switchAddonOn } from '@/addons/state'
import { TEXT_CALL_LIST_KEY as KEY } from '@/addons/text-call-list'
import { enqueue } from '@/jobs/enqueue'
import { buildCallLists } from '@/jobs/build-call-lists'
import { setTexter } from '@/text/current'
import { FakeTexter } from '@/text/fake-texter'
import { TwilioTexter } from '@/text/twilio-texter'
import { TextSendError } from '@/text/texter'
import { loadHomeSend } from '@/app/app/home-send'
import { loadCallList } from '@/app/app/call-list-data'
import { loadTextNotice } from '@/text/text-notice'
import { handleTwilioWebhook } from '@/text/twilio-webhook'
import { twilioSignature } from '@/text/twilio-signature'
import { onPhoneChanged } from '@/text/verification'
import { stopTexting } from '@/text/text-facts'
import { retryStopTexting } from '@/text/stop-recovery'
import { reconcileBilling } from '@/billing/reconcile'
import { PLAN, ADDON_PRICES } from '@/config/costs'

describe.skipIf(!tryLoadIntegrationDatabaseUrl())('OR-056 round two', () => {
  const fixtures = auditFixtures(), env = { ...process.env }
  beforeEach(() => { delete process.env.ONRECORD_E2E; delete process.env.ONRECORD_DEMO; process.env.TEXTING_ENABLED = 'true'; setBillingGateway(new FakeBillingGateway()); setTexter(new FakeTexter()) })
  afterEach(() => vi.restoreAllMocks())
  afterAll(async () => { await fixtures.cleanup(); process.env = env; setBillingGateway(new StripeGateway()); setTexter(new TwilioTexter()) })
  async function account() {
    const home = await fixtures.household()
    await getRuntimeDb().db.update(accounts).set({ phoneVerifiedAt: AUDIT_NOW }).where(eq(accounts.id, home.accountId))
    const [sub] = await getRuntimeDb().db.select().from(subscriptions).where(eq(subscriptions.accountId, home.accountId))
    return { ...home, subId: sub.stripeSubId!, fake: getBillingGateway() as FakeBillingGateway }
  }
  async function quotes(accountId: string) {
    return getRuntimeDb().db.select().from(jobs).where(and(eq(jobs.kind, 'checkout_quote'), isNull(jobs.completedAt), sql`${jobs.payload}->>'accountId' = ${accountId}`))
  }
  test('Stripe creation failure leaves no hold and the next purchase succeeds', async () => {
    const home = await account()
    await getRuntimeDb().db.delete(subscriptions).where(eq(subscriptions.accountId, home.accountId))
    const fail = vi.spyOn(home.fake, 'createCheckoutSession').mockRejectedValueOnce(new Error('Stripe hiccup'))
    await expect(startCheckout(home.accountId)).rejects.toThrow('Stripe hiccup')
    expect(await quotes(home.accountId)).toEqual([])
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(true)
    expect(await startCheckout(home.accountId)).toContain('checkout.stripe.test')
    expect(fail).toHaveBeenCalledTimes(2)
    expect((await quotes(home.accountId))[0].payload.sessionId).toBeTruthy()
  })
  test('a legacy missing-session hold clears itself after provider confirmation', async () => {
    const home = await account()
    await getRuntimeDb().db.delete(subscriptions).where(eq(subscriptions.accountId, home.accountId))
    await enqueue('checkout_quote', { accountId: home.accountId }, new Date())
    expect(await startCheckout(home.accountId)).toContain('checkout.stripe.test')
    expect(await quotes(home.accountId)).toHaveLength(1)
    expect((await quotes(home.accountId))[0].payload.sessionId).toBeTruthy()
  })
  test('lost create response recovers the open session without another purchase', async () => {
    const home = await account()
    await getRuntimeDb().db.delete(subscriptions).where(eq(subscriptions.accountId, home.accountId))
    const create = home.fake.createCheckoutSession.bind(home.fake)
    vi.spyOn(home.fake, 'createCheckoutSession').mockImplementationOnce(async (input) => { await create(input); throw new Error('response lost') })
    await expect(startCheckout(home.accountId)).rejects.toThrow('response lost')
    expect(await startCheckout(home.accountId)).toBe('https://checkout.stripe.test/1')
    expect(home.fake.checkouts).toHaveLength(1)
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(false)
  })
  test('an expired quote clears and a completed orphan activates without a second purchase', async () => {
    const home = await account()
    await getRuntimeDb().db.delete(subscriptions).where(eq(subscriptions.accountId, home.accountId))
    await startCheckout(home.accountId)
    home.fake.checkoutSessions.get('cs_test_1')!.status = 'expired'
    expect(await startCheckout(home.accountId)).toContain('/2')
    const sub = home.fake.completeCheckout(home.fake.checkouts[1], new Date('2099-01-01'))
    // Model an uncommitted hold save: the durable non-holding attempt survives.
    await getRuntimeDb().db.update(jobs).set({ completedAt: new Date(), payload: { accountId: home.accountId, attempt: true, quote: new Date().toISOString() } }).where(and(eq(jobs.kind, 'checkout_quote'), isNull(jobs.completedAt), sql`${jobs.payload}->>'accountId' = ${home.accountId}`))
    expect(await startCheckout(home.accountId)).not.toContain('checkout.stripe.test')
    expect(home.fake.checkouts).toHaveLength(2)
    expect((await getRuntimeDb().db.select().from(subscriptions).where(eq(subscriptions.accountId, home.accountId)))[0].stripeSubId).toBe(sub.id)
  })
  test('old lost-response recovery searches its original attempt window', async () => {
    const home = await account()
    await getRuntimeDb().db.delete(subscriptions).where(eq(subscriptions.accountId, home.accountId))
    const created = new Date('2026-01-01T12:00:00Z')
    const id = await enqueue('checkout_quote', { accountId: home.accountId, attempt: true, quote: created.toISOString() }, created)
    await getRuntimeDb().db.update(jobs).set({ completedAt: created }).where(eq(jobs.id, id.id))
    const find = vi.spyOn(home.fake, 'findCheckoutSessions')
    await startCheckout(home.accountId)
    expect(find).toHaveBeenCalledWith(home.accountId, created.getTime() / 1000 - 60, created.getTime() / 1000 + 31 * 60)
  })
  test('dashboard loaders and monthly text survive Stripe outage without a live read', async () => {
    const home = await account()
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(true)
    const reads = vi.spyOn(home.fake, 'getSubscription').mockRejectedValue(new Error('Stripe outage'))
    const texter = new FakeTexter(); setTexter(texter)
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(true)
    expect((await loadAddonStates(home.accountId)).states.find((state) => state.addon.key === KEY)?.enabled).toBe(true)
    await loadHomeSend(home.accountId); await loadCallList(home.accountId, AUDIT_NOW); await loadTextNotice(home.accountId)
    await buildCallLists({ accountId: home.accountId, asOf: AUDIT_NOW.toISOString() }, ctx)
    expect(texter.calls).toHaveLength(1)
    expect(reads).not.toHaveBeenCalled()
  })
  test('a rejected update and unavailable refresh retain the last confirmed entitlement', async () => {
    const home = await account()
    const read = home.fake.getSubscription.bind(home.fake)
    let updateStarted = false
    vi.spyOn(home.fake, 'getSubscription').mockImplementation(async (id) => { if (updateStarted) throw new Error('refresh outage'); return read(id) })
    vi.spyOn(home.fake, 'setMonthlyTotal').mockImplementation(async () => { updateStarted = true; throw new Error('update refused') })
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(false)
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(false)
    expect(await getRuntimeDb().db.select().from(jobs).where(and(eq(jobs.kind, 'billing_reconcile'), isNull(jobs.completedAt), sql`${jobs.payload}->>'accountId' = ${home.accountId}`))).toHaveLength(1)
  })
  test('background reconciliation updates stored entitlement after an ambiguous accepted update', async () => {
    const home = await account()
    const read = home.fake.getSubscription.bind(home.fake), update = home.fake.setMonthlyTotal.bind(home.fake)
    let lost = false
    vi.spyOn(home.fake, 'getSubscription').mockImplementation(async (id) => { if (lost) throw new Error('read outage'); return read(id) })
    vi.spyOn(home.fake, 'setMonthlyTotal').mockImplementation(async (...args) => { await update(...args); lost = true; throw new Error('response lost') })
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(false)
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(false)
    lost = false
    await reconcileBilling({ accountId: home.accountId }, ctx)
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(true)
  })
  test('a call-list switch-off failure surfaces and remains visible', async () => {
    const home = await account()
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(true)
    vi.spyOn(home.fake, 'setMonthlyTotal').mockRejectedValue(new Error('billing unavailable'))
    const texter = new FakeTexter(); texter.failWith = () => new TextSendError('unreachable', 30003); setTexter(texter)
    await expect(buildCallLists({ accountId: home.accountId, asOf: AUDIT_NOW.toISOString() }, ctx)).rejects.toThrow(/switch-off failed/)
    expect(await loadTextNotice(home.accountId)).toBe('billing_pending')
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(true)
  })
  test('a phone change confirms switch-off even when its cached entitlement is off', async () => {
    const home = await account()
    home.fake.update(home.subId, { addonKeys: [KEY], monthlyCents: PLAN.priceCents + ADDON_PRICES.cents[KEY] })
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(false)
    const failed = vi.spyOn(home.fake, 'setMonthlyTotal').mockRejectedValue(new Error('billing unavailable'))
    expect(await onPhoneChanged(home.accountId)).toMatchObject({ addonTurnedOff: false, error: expect.stringMatching(/could not be turned off/) })
    expect(await loadTextNotice(home.accountId)).toBe('billing_pending')
    failed.mockRestore()
    await retryStopTexting({ accountId: home.accountId }, ctx)
    expect((await home.fake.getSubscription(home.subId)).addonKeys).toEqual([])
    expect((await home.fake.getSubscription(home.subId)).monthlyCents).toBe(PLAN.priceCents)
  })
  test.each([false, true])('STOP confirms provider switch-off even when cached state is off: worker=%s', async (worker) => {
    const home = await account()
    home.fake.update(home.subId, { addonKeys: [KEY], monthlyCents: PLAN.priceCents + ADDON_PRICES.cents[KEY] })
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(false)
    if (worker) await retryStopTexting({ accountId: home.accountId }, ctx)
    else await stopTexting(getRuntimeDb().db, home.accountId, '+19095550147', 'stop_received', AUDIT_NOW)
    expect((await home.fake.getSubscription(home.subId)).addonKeys).toEqual([])
    expect((await home.fake.getSubscription(home.subId)).monthlyCents).toBe(PLAN.priceCents)
  })
  test('one STOP webhook durably queues recovery without a Twilio retry', async () => {
    const home = await account()
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(true)
    process.env.TWILIO_AUTH_TOKEN = 'round-two-local-only'
    await getRuntimeDb().db.update(accounts).set({ phone: '9095550198' }).where(eq(accounts.id, home.accountId))
    const url = 'https://onrecord.example/api/webhooks/twilio', params = { From: '+19095550198', Body: 'STOP' }
    const fail = vi.spyOn(home.fake, 'setMonthlyTotal').mockRejectedValue(new Error('billing unavailable'))
    await expect(handleTwilioWebhook(url, params, twilioSignature(url, params, process.env.TWILIO_AUTH_TOKEN))).rejects.toThrow(/switch-off failed/)
    const [pending] = await getRuntimeDb().db.select().from(jobs).where(and(eq(jobs.kind, 'stop_texting'), isNull(jobs.completedAt), sql`${jobs.payload}->>'accountId' = ${home.accountId}`))
    expect(pending).toBeDefined()
    expect(await loadTextNotice(home.accountId)).toBe('billing_pending')
    fail.mockRestore()
    await retryStopTexting(pending.payload, ctx)
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(false)
    expect((await home.fake.getSubscription(home.subId)).monthlyCents).toBe(PLAN.priceCents)
    expect(await loadTextNotice(home.accountId)).toBe('stopped')
  })
})
