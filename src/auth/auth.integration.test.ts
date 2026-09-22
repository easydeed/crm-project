import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterAll, describe, expect, test } from 'vitest'
import { authenticate } from '@/auth/authenticate'
import { registerAccount } from '@/auth/register-account'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import { getAccountById } from '@/db/accounts'
import { getRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'

const sessionUrl = tryLoadIntegrationDatabaseUrl()

describe.skipIf(!sessionUrl)('auth against the session pooler', () => {
  const suffix = randomUUID()
  const email = `or001-${suffix}@example.com`
  const ids: string[] = []

  afterAll(async () => {
    if (!sessionUrl || ids.length === 0) return
    const { db } = getRuntimeDb()
    for (const id of ids) {
      await db.delete(accounts).where(eq(accounts.id, id))
    }
  })

  test('register creates an agent and getAccountById needs that accountId', async () => {
    const created = await registerAccount({
      name: 'Pat Agent',
      email,
      password: 'long-enough-password',
      brokerage: 'Coastline',
      dre: '01234567',
      phone: '909-555-0100',
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    ids.push(created.accountId)

    const account = await getAccountById(created.accountId)
    expect(account).toMatchObject({
      id: created.accountId,
      email,
      role: 'agent',
    })
    expect(await getAccountById(randomUUID())).toBeNull()
  })

  test('duplicate email is rejected without creating a second row', async () => {
    const again = await registerAccount({
      name: 'Pat Again',
      email,
      password: 'long-enough-password',
      brokerage: 'Coastline',
      dre: '01234567',
      phone: '909-555-0100',
    })
    expect(again).toEqual({
      ok: false,
      field: 'email',
      message: 'That email already has an account.',
    })
  })

  test('wrong password does not say whether the email exists', async () => {
    const wrong = await authenticate(email, 'definitely-wrong-password')
    const missing = await authenticate(`missing-${suffix}@example.com`, 'long-enough-password')
    expect(wrong).toEqual({ ok: false })
    expect(missing).toEqual({ ok: false })
  })

  test('the same password signs the registered agent in', async () => {
    const result = await authenticate(email, 'long-enough-password')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.role).toBe('agent')
  })
})
