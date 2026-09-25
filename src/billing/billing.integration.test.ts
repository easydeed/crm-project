import { randomUUID } from 'node:crypto'
import { eq, inArray, sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { POST } from '@/app/api/webhooks/stripe/route'
import { loadHomeSend } from '@/app/app/home-send'
import { loadCallList } from '@/app/app/call-list-data'
import { registerAccount } from '@/auth/register-account'
import { loadBillingView, setCancelAtPeriodEnd, startCheckout } from '@/billing/account-billing'
import { setBillingGateway } from '@/billing/current'
import { FakeBillingGateway } from '@/billing/fake-gateway'
import { loadBillingState } from '@/billing/load-state'
import { signStripePayload } from '@/billing/signature'
import { billingAllowsSending } from '@/billing/status'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import { accounts, contacts, jobs, subscriptions } from '@/db/schema'
import { stripeEvents } from '@/db/schema-billing'
import { scheduleAccountById } from '@/jobs/schedule'

const databaseUrl = tryLoadIntegrationDatabaseUrl()
const SECRET = 'whsec_integration_only'
const PERIOD_END = new Date(Date.now() + 20 * 86_400_000)
const SEND_DAY_NOW = new Date('2026-06-15T17:00:00.000Z')

describe.skipIf(!databaseUrl)('OR-018 Stripe billing against the database', () => {
  const fake = new FakeBillingGateway()
  const accountIds: string[] = []
  const eventIds: string[] = []

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    process.env.STRIPE_WEBHOOK_SECRET = SECRET
    await resetRuntimeDb()
    setBillingGateway(fake)
  })

  afterAll(async () => {
    const { db, client } = getRuntimeDb()
    await db.delete(stripeEvents).where(inArray(stripeEvents.id, eventIds))
    await db.delete(jobs).where(inArray(sql`${jobs.payload}->>'accountId'`, accountIds))
    await db.delete(subscriptions).where(inArray(subscriptions.accountId, accountIds))
    await db.delete(accounts).where(inArray(accounts.id, accountIds))
    delete process.env.STRIPE_WEBHOOK_SECRET
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  async function newAccount() {
    const created = await registerAccount({
      name: 'OR018 Agent', email: `or018-${randomUUID()}@example.com`, password: 'long-enough-password',
      brokerage: 'Coastline Realty', dre: '01998432', phone: '909-555-0147',
    })
    if (!created.ok) throw new Error('register failed')
    accountIds.push(created.accountId)
    const { db } = getRuntimeDb()
    await db.update(accounts).set({ sendDay: 15, sendTime: '09:00', timezone: 'America/Los_Angeles' }).where(eq(accounts.id, created.accountId))
    return created.accountId
  }

  function eventBody(type: string, object: Record<string, unknown>, id = `evt_${randomUUID()}`) {
    eventIds.push(id)
    return JSON.stringify({ id, type, data: { object } })
  }

  async function deliver(body: string, signature: string | null = signStripePayload(body, SECRET)) {
    const headers = signature ? { 'stripe-signature': signature } : undefined
    return POST(new Request('http://localhost/api/webhooks/stripe', { method: 'POST', body, headers }))
  }

  async function row(accountId: string) {
    const { db } = getRuntimeDb()
    const [found] = await db.select().from(subscriptions).where(eq(subscriptions.accountId, accountId))
    return found
  }

  async function subscribe(accountId: string) {
    await startCheckout(accountId)
    const sub = fake.completeCheckout(fake.checkouts.at(-1)!, PERIOD_END)
    const body = eventBody('checkout.session.completed', {
      id: `cs_${randomUUID()}`, client_reference_id: accountId, customer: sub.customerId, subscription: sub.id,
    })
    return { sub, body, response: await deliver(body) }
  }

  test('checkout creates a subscription and the webhook activates the account', async () => {
    const accountId = await newAccount()
    const { db } = getRuntimeDb()
    expect(billingAllowsSending(await loadBillingState(db, accountId), new Date())).toBe(false)
    expect(await loadHomeSend(accountId)).toEqual({ kind: 'billing', issue: 'no_subscription' })

    const { sub, response } = await subscribe(accountId)
    expect(fake.checkouts.at(-1)).toMatchObject({ accountId, customerId: null })
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ outcome: 'applied' })
    expect(await row(accountId)).toMatchObject({
      stripeSubId: sub.id, stripeCustomerId: sub.customerId, status: 'active', cancelAtPeriodEnd: false, currentPeriodEnd: PERIOD_END,
    })
    expect(billingAllowsSending(await loadBillingState(db, accountId), new Date())).toBe(true)
  })

  test('a replayed event changes nothing, even when Stripe has moved on since', async () => {
    const accountId = await newAccount()
    const { sub, body } = await subscribe(accountId)
    const before = await row(accountId)
    fake.update(sub.id, { status: 'past_due' })
    const replay = await deliver(body)
    expect(replay.status).toBe(200)
    expect(await replay.json()).toMatchObject({ outcome: 'duplicate' })
    expect(await row(accountId)).toEqual(before)
    const { db } = getRuntimeDb()
    const id = (JSON.parse(body) as { id: string }).id
    const stored = await db.select().from(stripeEvents).where(eq(stripeEvents.id, id))
    expect(stored).toHaveLength(1)
    expect(stored[0]?.payload).toMatchObject({ type: 'checkout.session.completed' })
  })

  test('a bad or missing signature is a 404 and records nothing', async () => {
    const accountId = await newAccount()
    const body = eventBody('checkout.session.completed', { client_reference_id: accountId, subscription: 'sub_forged' })
    const forged = await deliver(body, signStripePayload(body, 'whsec_someone_else'))
    const missing = await deliver(body, null)
    const tampered = await deliver(body.replace('sub_forged', 'sub_other'), signStripePayload(body, SECRET))
    for (const response of [forged, missing, tampered]) expect(response.status).toBe(404)
    const { db } = getRuntimeDb()
    expect(await db.select().from(stripeEvents).where(eq(stripeEvents.id, (JSON.parse(body) as { id: string }).id))).toHaveLength(0)
    expect(await row(accountId)).toBeUndefined()
  })

  test('cancel sends until the period ends, resume restores it, then the end stops mail but keeps everything', async () => {
    const accountId = await newAccount()
    const { sub } = await subscribe(accountId)
    const { db } = getRuntimeDb()
    await db.insert(contacts).values([
      { accountId, name: 'Kept One', email: `kept1-${randomUUID()}@example.com`, addressRaw: '1 Oak St', status: 'no_parcel' },
      { accountId, name: 'Kept Two', email: `kept2-${randomUUID()}@example.com`, addressRaw: '2 Oak St', status: 'no_parcel' },
    ])
    const updated = () => deliver(eventBody('customer.subscription.updated', { id: sub.id }))

    await setCancelAtPeriodEnd(accountId, true)
    expect((await row(accountId))?.cancelAtPeriodEnd).toBe(false) // only the webhook writes the cache
    await updated()
    expect((await row(accountId))?.cancelAtPeriodEnd).toBe(true)
    const canceling = await loadBillingState(db, accountId)
    expect(billingAllowsSending(canceling, new Date(PERIOD_END.getTime() - 60_000))).toBe(true)
    expect(billingAllowsSending(canceling, PERIOD_END)).toBe(false)

    await setCancelAtPeriodEnd(accountId, false)
    await updated()
    expect(await row(accountId)).toMatchObject({ status: 'active', cancelAtPeriodEnd: false })
    await expect(setCancelAtPeriodEnd(accountId, false, new Date(PERIOD_END.getTime() + 1))).rejects.toThrow(/already ended/)

    await setCancelAtPeriodEnd(accountId, true)
    fake.update(sub.id, { status: 'canceled' })
    await deliver(eventBody('customer.subscription.deleted', { id: sub.id }))
    expect((await row(accountId))?.status).toBe('canceled')
    expect(await loadHomeSend(accountId)).toEqual({ kind: 'billing', issue: 'canceled' })

    const people = await db.select({ count: sql<number>`count(*)::int` }).from(contacts).where(eq(contacts.accountId, accountId))
    expect(people[0]?.count).toBe(2)
    await expect(loadCallList(accountId)).resolves.toBeDefined()
    await scheduleAccountById(accountId, SEND_DAY_NOW)
    const queued = await db.select({ kind: jobs.kind }).from(jobs).where(sql`${jobs.payload}->>'accountId' = ${accountId}`)
    expect(queued.map((job) => job.kind)).toEqual(['build_call_lists'])
  })

  test('payment_failed moves the account to past_due and the dashboard says so', async () => {
    const accountId = await newAccount()
    const { sub } = await subscribe(accountId)
    fake.update(sub.id, { status: 'past_due' })
    const response = await deliver(eventBody('invoice.payment_failed', { id: 'in_1', parent: { subscription_details: { subscription: sub.id } } }))
    expect(await response.json()).toMatchObject({ outcome: 'applied' })
    expect((await row(accountId))?.status).toBe('past_due')
    expect(await loadHomeSend(accountId)).toEqual({ kind: 'billing', issue: 'past_due' })
    const { db } = getRuntimeDb()
    expect(billingAllowsSending(await loadBillingState(db, accountId), new Date())).toBe(false)
  })

  test('the billing view reads the card and invoice history from Stripe', async () => {
    const accountId = await newAccount()
    expect(await loadBillingView(accountId)).toEqual({ kind: 'none' })
    const { sub } = await subscribe(accountId)
    fake.invoices.set(sub.customerId, [
      { id: 'in_paid', created: new Date('2026-09-01T00:00:00Z'), amountCents: 1900, status: 'paid', url: 'https://invoice.stripe.test/paid' },
    ])
    expect(await loadBillingView(accountId)).toMatchObject({
      kind: 'subscribed', status: 'active', cardLast4: '4242', invoices: [{ id: 'in_paid', amountCents: 1900 }],
    })
  })

  test('an event for a subscription nobody owns is recorded and changes nothing', async () => {
    const response = await deliver(eventBody('customer.created', { id: 'cus_nobody' }))
    expect(await response.json()).toMatchObject({ outcome: 'recorded' })
  })
})
