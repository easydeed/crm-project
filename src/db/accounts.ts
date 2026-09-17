import { eq, sql } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, contacts } from '@/db/schema'

export type AccountRecord = {
  id: string
  email: string
  name: string
  role: 'agent' | 'admin'
  brokerage: string | null
  dre: string | null
  phone: string | null
}

export async function getAccountById(accountId: string): Promise<AccountRecord | null> {
  const { db } = getRuntimeDb()
  const [row] = await db
    .select({
      id: accounts.id,
      email: accounts.email,
      name: accounts.name,
      role: accounts.role,
      brokerage: accounts.brokerage,
      dre: accounts.dre,
      phone: accounts.phone,
    })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1)
  return row ?? null
}

export async function countContactsForAccount(accountId: string): Promise<number> {
  const { db } = getRuntimeDb()
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contacts)
    .where(eq(contacts.accountId, accountId))
  return row?.count ?? 0
}
