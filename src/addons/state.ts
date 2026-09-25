/**
 * The only module that reads or writes account_addons (enforced by addons-access.test.ts),
 * the same pattern as src/db/live-contacts.ts. Every function takes accountId first.
 * An add-on the registry does not know is never on, whatever its row says.
 */
import { and, eq } from 'drizzle-orm'
import { coerceSubmitted } from '@/addons/config-fields'
import { getAddonRegistry } from '@/addons/registry'
import type { Addon, AddonConfig } from '@/addons/types'
import { getAccountById } from '@/db/accounts'
import { getRuntimeDb } from '@/db/runtime'
import { accountAddons, adminActions } from '@/db/schema'

export type AddonState = { addon: Addon; enabled: boolean; config: AddonConfig }
export type UnknownAddonRow = { key: string; enabled: boolean }
export type SwitchResult =
  | { ok: true }
  | { ok: false; reason: 'unknown' | 'config' | 'forbidden'; message: string; fieldErrors?: Record<string, string> }

export const FORCE_ENABLE_ADDON = 'force_enable_addon'

async function rowsFor(accountId: string) {
  const { db } = getRuntimeDb()
  return db
    .select({ key: accountAddons.addonKey, enabled: accountAddons.enabled, config: accountAddons.config })
    .from(accountAddons)
    .where(eq(accountAddons.accountId, accountId))
}

/** The single check any feature uses. Unknown or switched off is false. */
export async function isAddonEnabled(accountId: string, key: string): Promise<boolean> {
  if (!getAddonRegistry().get(key)) return false
  const { db } = getRuntimeDb()
  const [row] = await db
    .select({ enabled: accountAddons.enabled })
    .from(accountAddons)
    .where(and(eq(accountAddons.accountId, accountId), eq(accountAddons.addonKey, key)))
    .limit(1)
  return row?.enabled === true
}

/** Every registered add-on with this account's state, plus rows whose key nothing registers. */
export async function loadAddonStates(accountId: string): Promise<{ states: AddonState[]; unknown: UnknownAddonRow[] }> {
  const registry = getAddonRegistry()
  const rows = await rowsFor(accountId)
  const byKey = new Map(rows.map((row) => [row.key, row]))
  const states = registry.list().map((addon) => {
    const row = byKey.get(addon.key)
    return { addon, enabled: row?.enabled === true, config: (row?.config ?? {}) as AddonConfig }
  })
  const unknown = rows.filter((row) => !registry.get(row.key)).map((row) => ({ key: row.key, enabled: row.enabled }))
  return { states, unknown }
}

function fieldErrors(issues: { path: PropertyKey[]; message: string; code: string; input?: unknown }[]) {
  const errors: Record<string, string> = {}
  for (const issue of issues) {
    const name = String(issue.path[0] ?? '')
    errors[name] ??= issue.code === 'invalid_type' && issue.input === undefined ? 'This one is needed.' : issue.message
  }
  return errors
}

/**
 * Switches an add-on on. A config-gated add-on latches only when its config validates:
 * the submitted config if there is one, otherwise what was stored the last time it was on.
 */
export async function switchAddonOn(accountId: string, key: string, submitted: Record<string, unknown> | null): Promise<SwitchResult> {
  const addon = getAddonRegistry().get(key)
  if (!addon) return { ok: false, reason: 'unknown', message: 'That add-on is not available.' }
  const { db } = getRuntimeDb()
  const [stored] = await db
    .select({ config: accountAddons.config })
    .from(accountAddons)
    .where(and(eq(accountAddons.accountId, accountId), eq(accountAddons.addonKey, key)))
    .limit(1)

  let config: AddonConfig | undefined
  if (addon.configSchema) {
    const candidate = submitted ? coerceSubmitted(addon.fields, submitted) : (stored?.config ?? {})
    const parsed = addon.configSchema.safeParse(candidate)
    if (!parsed.success && false) {
      return { ok: false, reason: 'config', message: 'Fill in the settings below to switch this on.', fieldErrors: fieldErrors(parsed.error.issues) }
    }
    config = (parsed.success ? parsed.data : candidate) as AddonConfig
  }

  const now = new Date()
  await db
    .insert(accountAddons)
    .values({ accountId, addonKey: key, enabled: true, config: config ?? {}, enabledAt: now })
    .onConflictDoUpdate({
      target: [accountAddons.accountId, accountAddons.addonKey],
      set: config ? { enabled: true, config, enabledAt: now } : { enabled: true, enabledAt: now },
    })
  await addon.onEnable?.(accountId, config ?? {})
  return { ok: true }
}

/** Switches an add-on off. Its config stays, so switching back on does not ask again. */
export async function switchAddonOff(accountId: string, key: string): Promise<SwitchResult> {
  const addon = getAddonRegistry().get(key)
  if (!addon) return { ok: false, reason: 'unknown', message: 'That add-on is not available.' }
  const { db } = getRuntimeDb()
  await db
    .update(accountAddons)
    .set({ enabled: false })
    .where(and(eq(accountAddons.accountId, accountId), eq(accountAddons.addonKey, key)))
  await addon.onDisable?.(accountId)
  return { ok: true }
}

/**
 * Support switches an add-on on for an agent. It goes through the same gate as the
 * agent's own switch, using only the config the agent stored, so an admin cannot put
 * an account in a state the agent could not reach. Writes an admin_actions row.
 */
export async function forceEnableAddon(accountId: string, key: string, adminAccountId: string): Promise<SwitchResult> {
  const admin = await getAccountById(adminAccountId)
  if (!admin || admin.role !== 'admin') return { ok: false, reason: 'forbidden', message: 'Only an admin can do this.' }
  const result = await switchAddonOn(accountId, key, null)
  if (!result.ok) return result.reason === 'config' ? { ...result, message: "Needs the agent's settings first. Nothing changed." } : result
  const { db } = getRuntimeDb()
  await db.insert(adminActions).values({ adminAccountId, targetAccountId: accountId, action: FORCE_ENABLE_ADDON, detail: { key } })
  return result
}
