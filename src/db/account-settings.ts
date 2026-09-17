import { eq } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { getAccountById, type AccountRecord } from '@/db/accounts'
import { accounts } from '@/db/schema'

export type AccountDetailsInput = {
  name: string
  brokerage: string | null
  dre: string | null
  phone: string | null
}

export type AccountAppearanceInput = {
  senderName: string | null
  replyTo: string | null
  accentColor: string | null
}

export type AccountSendingInput = {
  sendDay: number
  sendTime: string
  timezone: string
  paused: boolean
}

export async function updateAccountDetails(
  accountId: string,
  input: AccountDetailsInput,
): Promise<AccountRecord | null> {
  const { db } = getRuntimeDb()
  await db
    .update(accounts)
    .set({
      name: input.name,
      brokerage: input.brokerage,
      dre: input.dre,
      phone: input.phone,
    })
    .where(eq(accounts.id, accountId))
  return getAccountById(accountId)
}

export async function updateAccountAppearance(
  accountId: string,
  input: AccountAppearanceInput,
): Promise<AccountRecord | null> {
  const { db } = getRuntimeDb()
  await db
    .update(accounts)
    .set({
      senderName: input.senderName,
      replyTo: input.replyTo,
      accentColor: input.accentColor,
    })
    .where(eq(accounts.id, accountId))
  return getAccountById(accountId)
}

export async function updateAccountSending(
  accountId: string,
  input: AccountSendingInput,
): Promise<AccountRecord | null> {
  const { db } = getRuntimeDb()
  await db
    .update(accounts)
    .set({
      sendDay: input.sendDay,
      sendTime: input.sendTime,
      timezone: input.timezone,
      paused: input.paused,
    })
    .where(eq(accounts.id, accountId))
  return getAccountById(accountId)
}
