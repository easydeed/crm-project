import { eq } from 'drizzle-orm'
import { afterAll, describe, expect, test } from 'vitest'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, subscriptions } from '@/db/schema'
import { auditFixtures } from '@/test/audit-fixtures'
import { startCheckout, setCancelAtPeriodEnd } from '@/billing/account-billing'
import { completeDemoCheckout, readDemoCheckout } from '@/billing/demo-checkout'
import { e2eBillingGateway } from '@/billing/e2e-gateway'
import { setBillingGateway } from '@/billing/current'
import { StripeGateway } from '@/billing/stripe-gateway'
import { requestDemoRecovery, resetPassword } from '@/auth/recovery'
import { authenticate } from '@/auth/authenticate'
import { switchAddonOn, switchAddonOff } from '@/addons/state'
import { TEXT_CALL_LIST_KEY } from '@/addons/text-call-list'
import { ADDON_PRICES, PLAN } from '@/config/costs'
import { requestPhoneCode, confirmPhoneCode } from '@/text/verification'
import { setTexter } from '@/text/current'
import { FakeTexter } from '@/text/fake-texter'
import { TwilioTexter } from '@/text/twilio-texter'

describe.skipIf(!tryLoadIntegrationDatabaseUrl())('OR-055 persistent demo workflows', () => {
  const fixtures = auditFixtures()
  const env = { ...process.env }
  afterAll(async () => { await fixtures.cleanup(); process.env = env; setBillingGateway(new StripeGateway()); setTexter(new TwilioTexter()) })

  test('checkout is local, account-bound, durable, and cannot be replayed to uncancel a plan', async () => {
    process.env.ONRECORD_E2E = '1'
    const home = await fixtures.household()
    const other = await fixtures.household()
    await getRuntimeDb().db.delete(subscriptions).where(eq(subscriptions.accountId, home.accountId))
    setBillingGateway(e2eBillingGateway())
    const url = await startCheckout(home.accountId)
    expect(url).toMatch(/^\/app\/settings\/billing\/demo-checkout\?token=/)
    const token = new URL(url, 'http://localhost').searchParams.get('token')!
    expect(readDemoCheckout(token, other.accountId)).toBeNull()
    await expect(completeDemoCheckout(token, other.accountId)).rejects.toThrow(/expired/)
    await completeDemoCheckout(token, home.accountId)
    const [row] = await getRuntimeDb().db.select().from(subscriptions).where(eq(subscriptions.accountId, home.accountId))
    expect(row).toMatchObject({ status: 'active', monthlyCents: PLAN.priceCents })
    await setCancelAtPeriodEnd(home.accountId, true)
    // Recreating the gateway simulates a process restart.
    const restarted = e2eBillingGateway()
    setBillingGateway(restarted)
    expect((await restarted.getSubscription(row.stripeSubId!)).cancelAtPeriodEnd).toBe(true)
    await completeDemoCheckout(token, home.accountId)
    expect((await restarted.getSubscription(row.stripeSubId!)).cancelAtPeriodEnd).toBe(true)
    await setCancelAtPeriodEnd(home.accountId, false)
    expect((await e2eBillingGateway().getSubscription(row.stripeSubId!)).cancelAtPeriodEnd).toBe(false)

    await getRuntimeDb().db.update(accounts).set({ phoneVerifiedAt: new Date() }).where(eq(accounts.id, home.accountId))
    expect(await switchAddonOn(home.accountId, TEXT_CALL_LIST_KEY, null)).toEqual({ ok: true })
    expect((await restarted.getSubscription(row.stripeSubId!)).monthlyCents).toBe(PLAN.priceCents + ADDON_PRICES.cents[TEXT_CALL_LIST_KEY])
    expect(await switchAddonOff(home.accountId, TEXT_CALL_LIST_KEY)).toEqual({ ok: true })
    expect((await restarted.getSubscription(row.stripeSubId!)).monthlyCents).toBe(PLAN.priceCents)
  })

  test('demo phone verification sends nothing and still validates the actual code', async () => {
    process.env.ONRECORD_E2E = '1'
    const home = await fixtures.household()
    const fake = new FakeTexter()
    setTexter(fake)
    const result = await requestPhoneCode(home.accountId)
    expect(result.ok).toBe(true)
    if (!result.ok || !result.demoCode) throw new Error('Missing demo verification code')
    expect(result.demoCode).toMatch(/^\d{6}$/)
    expect(await confirmPhoneCode(home.accountId, 'not-a-code')).toMatchObject({ ok: false })
    expect(await confirmPhoneCode(home.accountId, result.demoCode)).toEqual({ ok: true })
    expect(await confirmPhoneCode(home.accountId, result.demoCode)).toMatchObject({ ok: false })
    expect(fake.billable).toBe(false)
  })

  test('demo recovery token expires on password change, rejects forgery, and increments session version', async () => {
    process.env.ONRECORD_E2E = '1'
    const home = await fixtures.household()
    const link = await requestDemoRecovery(`audit-${home.accountId}@example.com`)
    // Use the account's actual generated email, not a fabricated fixture name.
    expect(link).toBeNull()
    const [account] = await getRuntimeDb().db.select().from(accounts).where(eq(accounts.id, home.accountId))
    const realLink = await requestDemoRecovery(account.email)
    expect(realLink).toBeTruthy()
    const token = new URL(realLink!, 'http://localhost').searchParams.get('token')!
    expect(await resetPassword(`${token}x`, 'changed-password-123')).toMatchObject({ ok: false })
    expect(await resetPassword(token, 'short')).toMatchObject({ ok: false })
    expect(await resetPassword(token, 'changed-password-123')).toEqual({ ok: true })
    expect(await resetPassword(token, 'another-password-123')).toMatchObject({ ok: false })
    expect(await authenticate(account.email, 'audit-password-only')).toEqual({ ok: false })
    expect(await authenticate(account.email, 'changed-password-123')).toMatchObject({ ok: true, authVersion: 1 })
    delete process.env.ONRECORD_E2E
    expect(await requestDemoRecovery(account.email)).toBeNull()
  })
})
