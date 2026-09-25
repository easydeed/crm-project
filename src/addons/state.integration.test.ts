import { randomUUID } from 'node:crypto'
import { and, eq, inArray } from 'drizzle-orm'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { createRegistry, setAddonRegistry } from '@/addons/registry'
import { FIXTURE_CONFIG, FIXTURE_PLAIN, FIXTURE_PRICES, FIXTURE_TEXTING } from '@/addons/fixtures'
import { FORCE_ENABLE_ADDON, forceEnableAddon, isAddonEnabled, loadAddonStates, switchAddonOff, switchAddonOn } from '@/addons/state'
import { AddonsList } from '@/app/admin/accounts/[id]/addons-list'
import { registerAccount } from '@/auth/register-account'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getRuntimeDb, resetRuntimeDb } from '@/db/runtime'
import { accountAddons, accounts, adminActions } from '@/db/schema'

const databaseUrl = tryLoadIntegrationDatabaseUrl()

describe.skipIf(!databaseUrl)('OR-021 add-on state against the database', () => {
  const accountIds: string[] = []
  const hooks: string[] = []

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl!
    await resetRuntimeDb()
    setAddonRegistry(
      createRegistry(
        [
          { ...FIXTURE_PLAIN, onEnable: async (id) => void hooks.push(`on:${id}`), onDisable: async (id) => void hooks.push(`off:${id}`) },
          FIXTURE_CONFIG,
          FIXTURE_TEXTING,
        ],
        FIXTURE_PRICES,
      ),
    )
  })

  afterAll(async () => {
    setAddonRegistry(null)
    const { db, client } = getRuntimeDb()
    await db.delete(adminActions).where(inArray(adminActions.targetAccountId, accountIds))
    await db.delete(accounts).where(inArray(accounts.id, accountIds))
    await client.end({ timeout: 2 })
    await resetRuntimeDb()
  })

  async function account(role: 'agent' | 'admin' = 'agent') {
    const created = await registerAccount({
      name: `OR021 ${role}`, email: `or021-${role}-${randomUUID()}@example.com`, password: 'long-enough-password',
      brokerage: 'Coastline Realty', dre: '01998432', phone: '909-555-0147',
    })
    if (!created.ok) throw new Error('register failed')
    accountIds.push(created.accountId)
    if (role === 'admin') await getRuntimeDb().db.update(accounts).set({ role }).where(eq(accounts.id, created.accountId))
    return created.accountId
  }

  async function row(accountId: string, key: string) {
    const [found] = await getRuntimeDb().db.select().from(accountAddons)
      .where(and(eq(accountAddons.accountId, accountId), eq(accountAddons.addonKey, key)))
    return found
  }

  test('a plain add-on switches on and off, and isAddonEnabled follows it', async () => {
    const id = await account()
    expect(await isAddonEnabled(id, 'fixture_plain')).toBe(false)
    expect(await switchAddonOn(id, 'fixture_plain', null)).toEqual({ ok: true })
    expect(await isAddonEnabled(id, 'fixture_plain')).toBe(true)
    expect(await switchAddonOff(id, 'fixture_plain')).toEqual({ ok: true })
    expect(await isAddonEnabled(id, 'fixture_plain')).toBe(false)
    expect(hooks).toEqual([`on:${id}`, `off:${id}`])
  })

  test('a row for an unknown key is ignored, never crashes, and is shown to admin', async () => {
    const id = await account()
    await getRuntimeDb().db.insert(accountAddons).values({ accountId: id, addonKey: 'retired_addon', enabled: true })
    expect(await isAddonEnabled(id, 'retired_addon')).toBe(false)
    expect((await switchAddonOn(id, 'retired_addon', null)).ok).toBe(false)
    const { states, unknown } = await loadAddonStates(id)
    expect(states.map((state) => state.addon.key)).toEqual(['fixture_plain', 'fixture_config', 'fixture_texting'])
    expect(unknown).toEqual([{ key: 'retired_addon', enabled: true }])
    const admin = renderToStaticMarkup(AddonsList({ accountId: id, states, unknown, forceEnable: async () => {} }))
    expect(admin).toContain('retired_addon</span> — Unknown add-on key — ignored.')
  })

  test('a config-gated add-on cannot latch with invalid config, checked on the server', async () => {
    const id = await account()
    const missing = await switchAddonOn(id, 'fixture_config', null)
    expect(missing).toMatchObject({ ok: false, reason: 'config', fieldErrors: { name: 'This one is needed.' } })
    const invalid = await switchAddonOn(id, 'fixture_config', { name: 'x', count: 'abc' })
    expect(invalid).toMatchObject({ ok: false, reason: 'config', fieldErrors: { name: 'At least two letters.' } })
    expect(invalid.ok === false && invalid.fieldErrors?.count).toBeTruthy()
    expect(await row(id, 'fixture_config')).toBeUndefined()
    expect(await isAddonEnabled(id, 'fixture_config')).toBe(false)
  })

  test('switching off and on again keeps the stored config and does not ask again', async () => {
    const id = await account()
    expect(await switchAddonOn(id, 'fixture_config', { name: 'Coastline Lending', count: '3' })).toEqual({ ok: true })
    expect((await row(id, 'fixture_config'))?.config).toEqual({ name: 'Coastline Lending', count: 3 })
    await switchAddonOff(id, 'fixture_config')
    expect(await row(id, 'fixture_config')).toMatchObject({ enabled: false, config: { name: 'Coastline Lending', count: 3 } })
    expect(await switchAddonOn(id, 'fixture_config', null)).toEqual({ ok: true })
    expect(await row(id, 'fixture_config')).toMatchObject({ enabled: true, config: { name: 'Coastline Lending', count: 3 } })
  })

  test('force-enable goes through the same gate, only for an admin, and writes an audit row', async () => {
    const agent = await account()
    const admin = await account('admin')
    const audit = () => getRuntimeDb().db.select().from(adminActions)
      .where(and(eq(adminActions.targetAccountId, agent), eq(adminActions.action, FORCE_ENABLE_ADDON)))

    expect(await forceEnableAddon(agent, 'fixture_plain', agent)).toMatchObject({ ok: false, reason: 'forbidden' })
    expect(await forceEnableAddon(agent, 'fixture_config', admin)).toMatchObject({ ok: false, reason: 'config' })
    expect(await isAddonEnabled(agent, 'fixture_config')).toBe(false)
    expect(await audit()).toHaveLength(0)

    expect(await forceEnableAddon(agent, 'fixture_plain', admin)).toEqual({ ok: true })
    await switchAddonOn(agent, 'fixture_config', { name: 'Coastline Lending' })
    await switchAddonOff(agent, 'fixture_config')
    expect(await forceEnableAddon(agent, 'fixture_config', admin)).toEqual({ ok: true })
    expect(await isAddonEnabled(agent, 'fixture_config')).toBe(true)
    const rows = await audit()
    expect(rows.map((r) => [r.adminAccountId, r.detail])).toEqual([[admin, { key: 'fixture_plain' }], [admin, { key: 'fixture_config' }]])

    const view = await loadAddonStates(agent)
    const html = renderToStaticMarkup(AddonsList({ accountId: agent, ...view, flash: { key: 'fixture_config', result: 'on' }, forceEnable: async () => {} }))
    expect(html).toContain('Fixture with settings</span> — on. name: Coastline Lending')
    expect(html).toContain('Force on')
  })
})
