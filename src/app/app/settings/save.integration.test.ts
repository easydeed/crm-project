import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterAll, describe, expect, test } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import { VIEW_AS_READ_ONLY } from '@/auth/write-guard'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { saveDetails } from '@/app/app/settings/save'
import { getAccountById } from '@/db/accounts'
import { getRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'

const sessionUrl = tryLoadIntegrationDatabaseUrl()

describe.skipIf(!sessionUrl)('view-as write block', () => {
  const ids: string[] = []

  afterAll(async () => {
    if (!sessionUrl || ids.length === 0) return
    const { db } = getRuntimeDb()
    for (const id of ids) {
      await db.delete(accounts).where(eq(accounts.id, id))
    }
  })

  test('saveDetails is rejected server-side and does not change the agent', async () => {
    const created = await registerAccount({
      name: 'Viewed Agent',
      email: `or003-${randomUUID()}@example.com`,
      password: 'long-enough-password',
      brokerage: 'Coastline',
      dre: '01234567',
      phone: '909-555-0100',
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    ids.push(created.accountId)

    const form = new FormData()
    form.set('name', 'Should Not Persist')
    form.set('brokerage', 'Hacked')
    form.set('dre', '01998432')
    form.set('phone', '909-555-0199')

    const result = await saveDetails(
      {
        accountId: created.accountId,
        role: 'admin',
        viewingAsAccountId: created.accountId,
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      form,
    )
    expect(result).toEqual({ error: VIEW_AS_READ_ONLY })

    const unchanged = await getAccountById(created.accountId)
    expect(unchanged).toMatchObject({
      name: 'Viewed Agent',
      brokerage: 'Coastline',
    })
  })
})
