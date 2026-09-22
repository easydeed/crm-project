import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterAll, describe, expect, test } from 'vitest'
import { authenticate } from '@/auth/authenticate'
import { registerAccount } from '@/auth/register-account'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { listAccountsForAdmin, recordViewAs } from '@/db/admin-accounts'
import { countContactsForAccount, getAccountById } from '@/db/accounts'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, adminActions } from '@/db/schema'

const sessionUrl = tryLoadIntegrationDatabaseUrl()

describe.skipIf(!sessionUrl)('admin account list and view-as audit', () => {
  const suffix = randomUUID()
  const ids: string[] = []

  afterAll(async () => {
    if (!sessionUrl || ids.length === 0) return
    const { db } = getRuntimeDb()
    for (const id of ids) {
      await db.delete(adminActions).where(eq(adminActions.adminAccountId, id))
      await db.delete(adminActions).where(eq(adminActions.targetAccountId, id))
      await db.delete(accounts).where(eq(accounts.id, id))
    }
  })

  test('search, sorts, contact count, last login, and view-as audit', async () => {
    const agent = await registerAccount({
      name: 'Zed Agent',
      email: `or003-zed-${suffix}@example.com`,
      password: 'long-enough-password',
      brokerage: 'Hillside',
      dre: '01234567',
      phone: '909-555-0100',
    })
    const admin = await registerAccount({
      name: 'Ada Admin',
      email: `or003-ada-${suffix}@example.com`,
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
    await authenticate(`or003-zed-${suffix}@example.com`, 'long-enough-password')

    const signedIn = await getAccountById(agent.accountId)
    const contacts = await countContactsForAccount(agent.accountId)
    expect(signedIn?.lastLoggedInAt).toBeTruthy()

    const searched = await listAccountsForAdmin(admin.accountId, { q: 'Hillside' })
    expect(searched.some((row) => row.id === agent.accountId)).toBe(true)
    expect(searched.every((row) => row.brokerage?.includes('Hillside') || row.name.includes('Hillside') || row.email.includes('Hillside'))).toBe(true)

    const bySignup = await listAccountsForAdmin(admin.accountId, { sort: 'signup', dir: 'desc' })
    const byContacts = await listAccountsForAdmin(admin.accountId, {
      sort: 'contacts',
      dir: 'desc',
    })
    const listed = bySignup.find((row) => row.id === agent.accountId)
    expect(listed?.contactCount).toBe(contacts)
    expect(listed?.lastLoggedInAt?.getTime()).toBe(signedIn?.lastLoggedInAt?.getTime())
    expect(byContacts.length).toBeGreaterThan(0)
    expect(await listAccountsForAdmin(agent.accountId, {})).toEqual([])

    const audit = await recordViewAs(admin.accountId, agent.accountId)
    expect(audit).toMatchObject({
      adminAccountId: admin.accountId,
      targetAccountId: agent.accountId,
      action: 'view_as',
    })
    expect(audit?.createdAt).toBeInstanceOf(Date)
  })
})
