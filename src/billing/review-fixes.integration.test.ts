import { eq } from 'drizzle-orm'
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, subscriptions } from '@/db/schema'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { auditFixtures } from '@/test/audit-fixtures'
import { getBillingGateway, setBillingGateway } from '@/billing/current'
import { FakeBillingGateway } from '@/billing/fake-gateway'
import { StripeGateway } from '@/billing/stripe-gateway'
import { e2eBillingGateway } from '@/billing/e2e-gateway'
import { completeDemoCheckout } from '@/billing/demo-checkout'
import { startCheckout } from '@/billing/account-billing'
import { isAddonEnabled, loadAddonStates, switchAddonOff, switchAddonOn } from '@/addons/state'
import { createRegistry, setAddonRegistry } from '@/addons/registry'
import { TEXT_CALL_LIST, TEXT_CALL_LIST_KEY as KEY } from '@/addons/text-call-list'
import { PLAN, ADDON_PRICES } from '@/config/costs'
import { onPhoneChanged } from '@/text/verification'
import { stopTexting } from '@/text/text-facts'
import { saveDetails } from '@/app/app/settings/save'
import { handleTwilioWebhook } from '@/text/twilio-webhook'
import { twilioSignature } from '@/text/twilio-signature'

describe.skipIf(!tryLoadIntegrationDatabaseUrl())('OR-056 billing and texting review', () => {
  const fixtures = auditFixtures()
  const env = { ...process.env }
  beforeEach(() => { delete process.env.ONRECORD_E2E; delete process.env.ONRECORD_DEMO; setBillingGateway(new FakeBillingGateway()) })
  afterEach(() => { vi.restoreAllMocks(); setAddonRegistry(null) })
  afterAll(async () => { await fixtures.cleanup(); process.env = env; setBillingGateway(new StripeGateway()) })

  async function readyAccount() {
    const home = await fixtures.household()
    await getRuntimeDb().db.update(accounts).set({ phoneVerifiedAt: new Date() }).where(eq(accounts.id, home.accountId))
    const [cached] = await getRuntimeDb().db.select().from(subscriptions).where(eq(subscriptions.accountId, home.accountId))
    const fake = getBillingGateway() as FakeBillingGateway
    fake.update(cached.stripeSubId!, { monthlyCents: PLAN.priceCents, addonKeys: [] })
    return { ...home, fake, subId: cached.stripeSubId! }
  }

  test.each([true, false])('demo checkout activation uses current choices: enabled=%s', async (enabled) => {
    const home = await readyAccount()
    process.env.ONRECORD_E2E = '1'
    setBillingGateway(e2eBillingGateway())
    await getRuntimeDb().db.delete(subscriptions).where(eq(subscriptions.accountId, home.accountId))
    if (!enabled) expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(true)
    const url = await startCheckout(home.accountId)
    expect((await (enabled ? switchAddonOn(home.accountId, KEY, null) : switchAddonOff(home.accountId, KEY))).ok).toBe(true)
    await completeDemoCheckout(new URL(url, 'http://localhost').searchParams.get('token')!, home.accountId)
    const [sub] = await getRuntimeDb().db.select().from(subscriptions).where(eq(subscriptions.accountId, home.accountId))
    expect(sub.monthlyCents).toBe(PLAN.priceCents + (enabled ? ADDON_PRICES.cents[KEY] : 0))
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(enabled)
  })

  test.each([true, false])('Stripe checkout quote cannot go stale: initially enabled=%s', async (enabled) => {
    const home = await readyAccount()
    await getRuntimeDb().db.delete(subscriptions).where(eq(subscriptions.accountId, home.accountId))
    if (enabled) expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(true)
    const url = await startCheckout(home.accountId)
    expect(await startCheckout(home.accountId)).toBe(url)
    const change = await (enabled ? switchAddonOff(home.accountId, KEY) : switchAddonOn(home.accountId, KEY, null))
    expect(change).toMatchObject({ ok: false, message: expect.stringMatching(/checkout/) })
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(enabled)
    const checkout = home.fake.checkouts.at(-1)!
    const sub = home.fake.completeCheckout(checkout, new Date('2099-01-01'))
    expect(sub.monthlyCents).toBe(PLAN.priceCents + (enabled ? ADDON_PRICES.cents[KEY] : 0))
    // Resolve a completed checkout without waiting for its webhook, then permit changes.
    expect((await (enabled ? switchAddonOff(home.accountId, KEY) : switchAddonOn(home.accountId, KEY, null))).ok).toBe(true)
    expect((await home.fake.getSubscription(sub.id)).monthlyCents).toBe(PLAN.priceCents + (!enabled ? ADDON_PRICES.cents[KEY] : 0))
  })

  test('DB rollback cannot update Stripe pricing or entitlement', async () => {
    const home = await readyAccount()
    setAddonRegistry(createRegistry([{ ...TEXT_CALL_LIST, onEnable: async () => { throw new Error('rollback the config') } }]))
    const update = vi.spyOn(home.fake, 'setMonthlyTotal')
    await expect(switchAddonOn(home.accountId, KEY, null)).rejects.toThrow('rollback the config')
    expect(update).not.toHaveBeenCalled()
    expect(await home.fake.getSubscription(home.subId)).toMatchObject({ monthlyCents: PLAN.priceCents, addonKeys: [] })
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(false)
  })

  test('rejected or uncertain price updates cannot split billing from paid entitlement', async () => {
    const home = await readyAccount()
    const original = home.fake.setMonthlyTotal.bind(home.fake)
    const change = vi.spyOn(home.fake, 'setMonthlyTotal').mockRejectedValue(new Error('provider refused'))
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(false)
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(false)
    expect((await home.fake.getSubscription(home.subId)).monthlyCents).toBe(PLAN.priceCents)
    change.mockImplementation(async (...args) => { await original(...args); throw new Error('response lost after acceptance') })
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(false)
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(true)
    expect((await home.fake.getSubscription(home.subId)).monthlyCents).toBe(PLAN.priceCents + ADDON_PRICES.cents[KEY])
  })

  test('a stale canceled cache cannot bypass current provider pricing', async () => {
    const home = await readyAccount()
    await getRuntimeDb().db.update(subscriptions).set({ status: 'canceled' }).where(eq(subscriptions.accountId, home.accountId))
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(true)
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(true)
    expect((await home.fake.getSubscription(home.subId)).monthlyCents).toBe(PLAN.priceCents + ADDON_PRICES.cents[KEY])
    await expect(startCheckout(home.accountId)).rejects.toThrow(/already has a plan/)
  })

  test('failed phone-change switch-off does not claim success in Settings', async () => {
    const home = await readyAccount()
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(true)
    vi.spyOn(home.fake, 'setMonthlyTotal').mockRejectedValue(new Error('billing unavailable'))
    const form = new FormData()
    form.set('name', 'Review Agent'); form.set('phone', '9095550155')
    const result = await saveDetails({ accountId: home.accountId, role: 'agent', exp: Math.floor(Date.now() / 1000) + 3600 }, form)
    expect(result.error).toMatch(/could not be turned off/)
    expect(result.notice).toBeUndefined()
    expect(result.savedAt).toBeUndefined()
    expect(result.detailsPersisted).toBe(true)
    expect(await onPhoneChanged(home.accountId)).toMatchObject({ addonTurnedOff: false, error: expect.any(String) })
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(true)
  })

  test('STOP clears verification but propagates a failed paid switch-off', async () => {
    const home = await readyAccount()
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(true)
    vi.spyOn(home.fake, 'setMonthlyTotal').mockRejectedValue(new Error('billing unavailable'))
    await expect(stopTexting(getRuntimeDb().db, home.accountId, '+19095550147', 'stop_received', new Date())).rejects.toThrow(/switch-off failed/)
    const [account] = await getRuntimeDb().db.select().from(accounts).where(eq(accounts.id, home.accountId))
    expect(account.phoneVerifiedAt).toBeNull()
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(true)
  })

  test('a provider read outage after a phone save returns a persisted error, never success', async () => {
    const home = await readyAccount()
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(true)
    vi.spyOn(home.fake, 'getSubscription').mockRejectedValue(new Error('provider read unavailable'))
    const form = new FormData(); form.set('name', 'Review Agent'); form.set('phone', '9095550155')
    const result = await saveDetails({ accountId: home.accountId, role: 'agent', exp: 2000000000 }, form)
    expect(result).toMatchObject({ detailsPersisted: true, error: expect.stringMatching(/could not confirm/) })
    expect(result.savedAt).toBeUndefined(); expect(result.notice).toBeUndefined()
    const [account] = await getRuntimeDb().db.select().from(accounts).where(eq(accounts.id, home.accountId))
    expect(account.phone).toBe('9095550155'); expect(account.phoneVerifiedAt).toBeNull()
  })

  test('a STOP webhook can retry switch-off after verification was cleared', async () => {
    const home = await readyAccount()
    await getRuntimeDb().db.update(accounts).set({ phone: '9095550199' }).where(eq(accounts.id, home.accountId))
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(true)
    process.env.TWILIO_AUTH_TOKEN = 'or056-local-webhook-only'
    const url = 'https://onrecord.example/api/webhooks/twilio'
    const params = { From: '+19095550199', Body: 'STOP' }
    const signature = twilioSignature(url, params, process.env.TWILIO_AUTH_TOKEN)
    const fail = vi.spyOn(home.fake, 'setMonthlyTotal').mockRejectedValue(new Error('billing unavailable'))
    await expect(handleTwilioWebhook(url, params, signature)).rejects.toThrow(/switch-off failed/)
    await expect(handleTwilioWebhook(url, params, signature)).rejects.toThrow(/switch-off failed/)
    fail.mockRestore()
    expect(await handleTwilioWebhook(url, params, signature)).toBe('stop')
    expect(await isAddonEnabled(home.accountId, KEY)).toBe(false)
    expect((await home.fake.getSubscription(home.subId)).monthlyCents).toBe(PLAN.priceCents)
  })

  test('an unpriced legacy plan is refused instead of silently repriced', async () => {
    const home = await readyAccount()
    home.fake.update(home.subId, { addonKeys: undefined, monthlyCents: null })
    const update = vi.spyOn(home.fake, 'setMonthlyTotal')
    expect(await switchAddonOn(home.accountId, KEY, null)).toMatchObject({ ok: false, message: expect.stringMatching(/reconciliation/) })
    expect(update).not.toHaveBeenCalled()
  })

  test('a correctly priced legacy plan initializes before its first switch', async () => {
    const home = await readyAccount()
    home.fake.update(home.subId, { addonKeys: undefined })
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(true)
    expect(await home.fake.getSubscription(home.subId)).toMatchObject({ monthlyCents: PLAN.priceCents + ADDON_PRICES.cents[KEY], addonKeys: [KEY] })
  })

  test('legacy entitlement cannot outrun its provider price even before a switch', async () => {
    const home = await readyAccount()
    const { db } = getRuntimeDb()
    const [cached] = await db.select().from(subscriptions).where(eq(subscriptions.accountId, home.accountId))
    await db.delete(subscriptions).where(eq(subscriptions.accountId, home.accountId))
    expect((await switchAddonOn(home.accountId, KEY, null)).ok).toBe(true)
    await db.insert(subscriptions).values(cached)
    home.fake.update(home.subId, { addonKeys: undefined, monthlyCents: PLAN.priceCents })
    await expect(isAddonEnabled(home.accountId, KEY)).rejects.toThrow(/reconciliation/)
    await expect(loadAddonStates(home.accountId)).rejects.toThrow(/reconciliation/)
  })
})
