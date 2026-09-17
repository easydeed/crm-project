import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { getAccountById } from '@/db/accounts'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, adminActions, contacts } from '@/db/schema'

export type AccountListSort = 'signup' | 'contacts'
export type AccountListDir = 'asc' | 'desc'

export type AccountListRow = {
  id: string
  name: string
  email: string
  brokerage: string | null
  createdAt: Date
  contactCount: number
  role: 'agent' | 'admin'
  lastLoggedInAt: Date | null
}

async function requireAdmin(adminAccountId: string) {
  const admin = await getAccountById(adminAccountId)
  if (!admin || admin.role !== 'admin') return null
  return admin
}

export async function listAccountsForAdmin(
  adminAccountId: string,
  filters: { q?: string; sort?: AccountListSort; dir?: AccountListDir },
): Promise<AccountListRow[]> {
  if (!(await requireAdmin(adminAccountId))) return []
  const { db } = getRuntimeDb()
  const q = filters.q?.trim()
  const search = q
    ? or(
        ilike(accounts.name, `%${q}%`),
        ilike(accounts.email, `%${q}%`),
        ilike(accounts.brokerage, `%${q}%`),
      )
    : undefined
  const dir = filters.dir === 'asc' ? asc : desc
  const order =
    filters.sort === 'contacts'
      ? dir(sql`count(${contacts.id})`)
      : dir(accounts.createdAt)

  return db
    .select({
      id: accounts.id,
      name: accounts.name,
      email: accounts.email,
      brokerage: accounts.brokerage,
      createdAt: accounts.createdAt,
      contactCount: sql<number>`count(${contacts.id})::int`,
      role: accounts.role,
      lastLoggedInAt: accounts.lastLoggedInAt,
    })
    .from(accounts)
    .leftJoin(contacts, eq(contacts.accountId, accounts.id))
    .where(search ? and(search) : undefined)
    .groupBy(accounts.id)
    .orderBy(order)
}

export async function recordViewAs(adminAccountId: string, targetAccountId: string) {
  const admin = await requireAdmin(adminAccountId)
  const target = await getAccountById(targetAccountId)
  if (!admin || !target || target.role !== 'agent') return null
  const { db } = getRuntimeDb()
  const [row] = await db
    .insert(adminActions)
    .values({
      adminAccountId,
      targetAccountId,
      action: 'view_as',
    })
    .returning({
      id: adminActions.id,
      adminAccountId: adminActions.adminAccountId,
      targetAccountId: adminActions.targetAccountId,
      action: adminActions.action,
      createdAt: adminActions.createdAt,
    })
  return row ?? null
}
