import { eq, sql } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, contacts } from '@/db/schema'
import { liveContacts } from '@/db/live-contacts'

export type AccountRecord = {
  id: string
  email: string
  name: string
  role: 'agent' | 'admin'
  brokerage: string | null
  dre: string | null
  phone: string | null
  senderName: string | null
  replyTo: string | null
  accentColor: string | null
  sendDay: number | null
  sendTime: string | null
  timezone: string | null
  paused: boolean
  lastLoggedInAt: Date | null
  createdAt: Date
}

const accountColumns = {
  id: accounts.id,
  email: accounts.email,
  name: accounts.name,
  role: accounts.role,
  brokerage: accounts.brokerage,
  dre: accounts.dre,
  phone: accounts.phone,
  senderName: accounts.senderName,
  replyTo: accounts.replyTo,
  accentColor: accounts.accentColor,
  sendDay: accounts.sendDay,
  sendTime: accounts.sendTime,
  timezone: accounts.timezone,
  paused: accounts.paused,
  lastLoggedInAt: accounts.lastLoggedInAt,
  createdAt: accounts.createdAt,
}

export async function getAccountById(accountId: string): Promise<AccountRecord | null> {
  const { db } = getRuntimeDb()
  const [row] = await db
    .select(accountColumns)
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
