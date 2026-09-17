import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterAll, describe, expect, test, vi } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import {
  createSessionValue,
  readSessionValue,
  SESSION_COOKIE,
} from '@/auth/session'
import { assertWritable, VIEW_AS_READ_ONLY } from '@/auth/write-guard'
import { loadDatabasePoolerUrl } from '@/config/database-url'
import { saveDetails } from '@/app/app/settings/save'
import { getAccountById } from '@/db/accounts'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, adminActions } from '@/db/schema'

const cookieJar = vi.hoisted(() => {
  const store = new Map<string, string>()
  return {
    clear() {
      store.clear()
    },
    get(name: string) {
      const value = store.get(name)
      return value === undefined ? undefined : { name, value }
    },
    set(name: string, value: string) {
      store.set(name, value)
    },
  }
})

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => cookieJar.get(name),
    set: (name: string, value: string) => {
      cookieJar.set(name, value)
    },
  }),
}))

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`)
  },
}))

const { exitViewAsAction } = await import('@/app/admin/actions')

let poolerUrl: string | null = null
try {
  poolerUrl = loadDatabasePoolerUrl()
} catch {
  poolerUrl = null
}

describe.skipIf(!poolerUrl)('exit view-as', () => {
  const ids: string[] = []

  afterAll(async () => {
    if (!poolerUrl || ids.length === 0) return
    const { db } = getRuntimeDb()
    for (const id of ids) {
      await db.delete(adminActions).where(eq(adminActions.adminAccountId, id))
      await db.delete(adminActions).where(eq(adminActions.targetAccountId, id))
      await db.delete(accounts).where(eq(accounts.id, id))
    }
  })

  test('exit clears view-as, returns to /admin/accounts, and restores admin writes', async () => {
    const suffix = randomUUID()
    const agent = await registerAccount({
      name: 'Viewed Agent',
      email: `or003a-${suffix}@example.com`,
      password: 'long-enough-password',
      brokerage: 'Coastline',
      dre: '01234567',
      phone: '909-555-0100',
    })
    const admin = await registerAccount({
      name: 'Ada Admin',
      email: `or003a-admin-${suffix}@example.com`,
      password: 'long-enough-password',
      brokerage: 'Onrecord',
      dre: '01234568',
      phone: '909-555-0101',
    })
    expect(agent.ok && admin.ok).toBe(true)
    if (!agent.ok || !admin.ok) return
    ids.push(admin.accountId, agent.accountId)

    const { db } = getRuntimeDb()
    await db.update(accounts).set({ role: 'admin' }).where(eq(accounts.id, admin.accountId))

    cookieJar.clear()
    cookieJar.set(
      SESSION_COOKIE,
      createSessionValue(admin.accountId, 'admin', agent.accountId),
    )
    const viewing = readSessionValue(cookieJar.get(SESSION_COOKIE)?.value)
    expect(viewing?.viewingAsAccountId).toBe(agent.accountId)
    expect(assertWritable(viewing!)).toEqual({ ok: false, error: VIEW_AS_READ_ONLY })

    await expect(exitViewAsAction()).rejects.toThrow('REDIRECT:/admin/accounts')

    const after = readSessionValue(cookieJar.get(SESSION_COOKIE)?.value)
    expect(after?.viewingAsAccountId).toBeUndefined()
    expect(after).toMatchObject({ accountId: admin.accountId, role: 'admin' })
    // Same gates as src/app/admin/layout.tsx: missing session redirects,
    // viewing-as redirects to /app, non-admin is 404.
    expect(Boolean(after) && !after?.viewingAsAccountId && after?.role === 'admin').toBe(true)

    expect(assertWritable(after!)).toEqual({ ok: true })
    const form = new FormData()
    form.set('name', 'Ada After Exit')
    form.set('brokerage', 'Onrecord')
    form.set('dre', '01234568')
    form.set('phone', '909-555-0101')
    const saved = await saveDetails(after!, form)
    expect(saved).toEqual({ savedAt: expect.any(Number) })
    expect(await getAccountById(admin.accountId)).toMatchObject({
      name: 'Ada After Exit',
      brokerage: 'Onrecord',
    })
  })
})
