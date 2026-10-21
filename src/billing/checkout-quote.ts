import { and, eq, isNull, sql } from 'drizzle-orm'
import { getBillingGateway } from '@/billing/current'
import { loadAddonStates } from '@/addons/state'
import { PLAN } from '@/config/costs'
import { withBillingLock } from '@/billing/account-lock'
import { cacheSubscription } from '@/billing/cache-subscription'
import { getRuntimeDb } from '@/db/runtime'
import { jobs, subscriptions } from '@/db/schema'
import { enqueue } from '@/jobs/enqueue'
import type { CheckoutInput } from '@/billing/gateway'
import type { JobHandler } from '@/jobs/types'

/** Durable quote holds use the existing job queue; ambiguous creation stays held. */
async function resolveQuote(accountId: string) {
  const { db } = getRuntimeDb()
  const [job] = await db.select().from(jobs).where(and(eq(jobs.kind, 'checkout_quote'), isNull(jobs.completedAt), sql`${jobs.payload}->>'accountId' = ${accountId}`)).limit(1)
  if (!job) return null
  const sessionId = job.payload.sessionId
  if (typeof sessionId !== 'string') throw new Error('Checkout status needs confirmation. Contact support before changing paid add-ons.')
  const session = await getBillingGateway().getCheckoutSession(sessionId)
  if (session.accountId !== accountId) throw new Error('Checkout belongs to another account')
  if (session.status === 'open') return session
  if (session.status === 'complete' && session.subscriptionId) {
    const sub = await getBillingGateway().getSubscription(session.subscriptionId)
    if (sub.accountId !== accountId) throw new Error('Subscription belongs to another account')
    await cacheSubscription(db, accountId, sub)
  } else if (session.status !== 'expired') throw new Error('Checkout status is not confirmed')
  await db.update(jobs).set({ completedAt: new Date(), error: null }).where(eq(jobs.id, job.id))
  return session
}

export async function assertCheckoutAllowsChanges(accountId: string) {
  const quote = await resolveQuote(accountId)
  if (quote?.status === 'open') throw new Error('Finish checkout or wait for it to expire before changing paid add-ons.')
}

export async function quotedCheckout(input: CheckoutInput) {
  return withBillingLock(input.accountId, async () => {
    const existing = await resolveQuote(input.accountId)
    if (existing?.status === 'open' && existing.url) return existing.url
    if (existing?.status === 'complete') return input.successUrl
    const [sub] = await getRuntimeDb().db.select().from(subscriptions).where(eq(subscriptions.accountId, input.accountId))
    if (sub?.stripeSubId && (await getBillingGateway().getSubscription(sub.stripeSubId)).status !== 'canceled') throw new Error('This account already has a plan')
    const { states } = await loadAddonStates(input.accountId)
    const enabled = states.filter((state) => state.enabled && state.addon.priceCents > 0)
    const expiresAt = Math.floor(Date.now() / 1000) + 31 * 60
    const payload = { accountId: input.accountId, quote: new Date().toISOString() }
    const job = await enqueue('checkout_quote', payload, new Date(expiresAt * 1000))
    const session = await getBillingGateway().createCheckoutSession({ ...input, expiresAt,
      monthlyCents: PLAN.priceCents + enabled.reduce((sum, state) => sum + state.addon.priceCents, 0),
      addonKeys: enabled.map((state) => state.addon.key).sort(),
    })
    if (!session.id) throw new Error('Checkout status needs confirmation')
    await getRuntimeDb().db.update(jobs).set({ payload: { ...payload, sessionId: session.id } }).where(eq(jobs.id, job.id))
    return session.url
  })
}

export const expireCheckoutQuote: JobHandler = async (payload) => {
  await withBillingLock(String(payload.accountId), () => assertCheckoutAllowsChanges(String(payload.accountId)))
}
