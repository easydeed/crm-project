import { and, desc, eq, isNull, or, sql } from 'drizzle-orm'
import { getBillingGateway } from '@/billing/current'
import { loadAddonStates } from '@/addons/state'
import { PLAN } from '@/config/costs'
import { withBillingLock } from '@/billing/account-lock'
import { cacheSubscription } from '@/billing/cache-subscription'
import { getRuntimeDb } from '@/db/runtime'
import { jobs, subscriptions } from '@/db/schema'
import type { CheckoutInput } from '@/billing/gateway'
import type { JobHandler } from '@/jobs/types'

/** Holds are saved only for known sessions; provider discovery recovers lost responses. */
async function resolveQuote(accountId: string) {
  const { db } = getRuntimeDb()
  const [job] = await db.select().from(jobs).where(and(eq(jobs.kind, 'checkout_quote'), or(isNull(jobs.completedAt), sql`${jobs.payload}->>'attempt' = 'true'`), sql`${jobs.payload}->>'accountId' = ${accountId}`)).orderBy(desc(jobs.enqueuedFor)).limit(1)
  if (!job) return null
  let sessionId = job.payload.sessionId
  if (typeof sessionId !== 'string') {
    const created = typeof job.payload.quote === 'string' ? new Date(job.payload.quote).getTime() : job.enqueuedFor.getTime() - 31 * 60_000
    if (!Number.isFinite(created)) throw new Error('Invalid checkout attempt timestamp')
    const discovered = await getBillingGateway().findCheckoutSessions(accountId, Math.floor(created / 1000) - 60, Math.ceil(created / 1000) + 31 * 60)
    const relevant = []
    for (const session of discovered) {
      if (session.status === 'open') relevant.push(session)
      else if (session.subscriptionId && (await getBillingGateway().getSubscription(session.subscriptionId)).status !== 'canceled') relevant.push(session)
    }
    if (relevant.length > 1) throw new Error('Multiple checkouts need reconciliation before buying again.')
    sessionId = relevant[0]?.id
    if (!sessionId) {
      await db.update(jobs).set({ payload: { ...job.payload, attempt: false }, completedAt: new Date(), error: null }).where(eq(jobs.id, job.id))
      return null
    }
    await db.update(jobs).set({ payload: { ...job.payload, attempt: false, sessionId }, completedAt: null }).where(eq(jobs.id, job.id))
  }
  const session = await getBillingGateway().getCheckoutSession(String(sessionId))
  if (session.accountId !== accountId) throw new Error('Checkout belongs to another account')
  if (session.status === 'open') return session
  if (session.status === 'complete' && session.subscriptionId) {
    const sub = await getBillingGateway().getSubscription(session.subscriptionId)
    if (sub.accountId !== accountId) throw new Error('Subscription belongs to another account')
    await db.transaction((tx) => cacheSubscription(tx, accountId, sub))
  } else if (session.status !== 'expired') throw new Error('Checkout status is not confirmed')
  await db.update(jobs).set({ payload: { accountId, sessionId, attempt: false }, completedAt: new Date(), error: null }).where(eq(jobs.id, job.id))
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
    // A completed attempt receipt is not an active hold. It retains the exact
    // recovery window if the response/save is lost, even months later.
    const [attempt] = await getRuntimeDb().db.insert(jobs).values({ kind: 'checkout_quote', payload: { ...payload, attempt: true }, payloadKey: `attempt:${input.accountId}:${crypto.randomUUID()}`, runAfter: new Date(expiresAt * 1000), completedAt: new Date() }).returning({ id: jobs.id })
    const session = await getBillingGateway().createCheckoutSession({ ...input, expiresAt,
      monthlyCents: PLAN.priceCents + enabled.reduce((sum, state) => sum + state.addon.priceCents, 0),
      addonKeys: enabled.map((state) => state.addon.key).sort(),
    })
    if (!session.id) throw new Error('Checkout status needs confirmation')
    await getRuntimeDb().db.update(jobs).set({ payload: { ...payload, sessionId: session.id, attempt: false }, completedAt: null }).where(eq(jobs.id, attempt.id))
    return session.url
  })
}

export const expireCheckoutQuote: JobHandler = async (payload) => {
  await withBillingLock(String(payload.accountId), () => assertCheckoutAllowsChanges(String(payload.accountId)))
}
