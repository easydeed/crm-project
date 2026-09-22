import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterAll, describe, expect, test } from 'vitest'
import { registerAccount } from '@/auth/register-account'
import { tryLoadIntegrationDatabaseUrl } from '@/db/integration-session'
import {
  updateAccountAppearance,
  updateAccountDetails,
  updateAccountSending,
} from '@/db/account-settings'
import { getAccountById } from '@/db/accounts'
import { getRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'

const sessionUrl = tryLoadIntegrationDatabaseUrl()

describe.skipIf(!sessionUrl)('settings writes against the session pooler', () => {
  const email = `or002-${randomUUID()}@example.com`
  const ids: string[] = []

  afterAll(async () => {
    if (!sessionUrl || ids.length === 0) return
    const { db } = getRuntimeDb()
    for (const id of ids) {
      await db.delete(accounts).where(eq(accounts.id, id))
    }
  })

  test('each settings section persists and reads back by accountId', async () => {
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

    await updateAccountDetails(created.accountId, {
      name: 'Pat Updated',
      brokerage: 'Hillside',
      dre: '01998432',
      phone: '9095550199',
    })
    await updateAccountAppearance(created.accountId, {
      senderName: 'Pat at Hillside',
      replyTo: 'pat@hillside.example',
      accentColor: '#2F5BFF',
    })
    await updateAccountSending(created.accountId, {
      sendDay: 15,
      sendTime: '08:00',
      timezone: 'America/Denver',
      paused: true,
    })

    const saved = await getAccountById(created.accountId)
    expect(saved).toMatchObject({
      name: 'Pat Updated',
      brokerage: 'Hillside',
      dre: '01998432',
      phone: '9095550199',
      senderName: 'Pat at Hillside',
      replyTo: 'pat@hillside.example',
      accentColor: '#2F5BFF',
      sendDay: 15,
      sendTime: '08:00',
      timezone: 'America/Denver',
      paused: true,
    })
  })
})
