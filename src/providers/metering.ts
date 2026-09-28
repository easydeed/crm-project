import { getRuntimeDb } from '@/db/runtime'
import { providerCalls } from '@/db/schema-billing'
import { COST_RATES, type CostRates } from '@/config/costs'

export type ProviderName = 'property' | 'listing' | 'text'

export type ProviderCall = { provider: ProviderName; operation: string; accountId: string | null; count: number }

/** Cost at the rate in force, or null while that rate is not set. */
export function callCostCents(call: Pick<ProviderCall, 'provider' | 'operation' | 'count'>, rates: CostRates = COST_RATES): number | null {
  const rate = rates.providerCallCents[`${call.provider}:${call.operation}`]
  return rate == null ? null : rate * call.count
}

/** A fixture's cost is a true zero, not a missing rate. */
export async function recordProviderCall(call: ProviderCall, rates: CostRates = COST_RATES, billable = true) {
  const { db } = getRuntimeDb()
  await db.insert(providerCalls).values({ ...call, costCents: billable ? callCostCents(call, rates) : 0 })
}

/**
 * Wraps every method of a provider so each call writes one provider_calls row, whether
 * the call succeeds or fails: the vendor bills the request either way.
 *
 * One rule for every provider. A billable one records the rate in costs.ts, null until it
 * is set. A fixture records zero, so /admin/costs shows the real call volume before a
 * paid feed replaces it.
 */
export function withMetering<T extends { billable: boolean }>(
  provider: T,
  name: ProviderName,
  options: { accountId?: string | null; record?: (call: ProviderCall) => Promise<void> } = {},
): T {
  const record = options.record ?? ((call: ProviderCall) => recordProviderCall(call, COST_RATES, provider.billable))
  return new Proxy(provider, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver)
      if (typeof value !== 'function' || typeof key !== 'string') return value
      return async (...args: unknown[]) => {
        try {
          return await value.apply(target, args)
        } finally {
          await record({ provider: name, operation: key, accountId: options.accountId ?? null, count: 1 })
        }
      }
    },
  })
}
