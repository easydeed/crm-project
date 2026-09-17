import { verifyPasswordOrDummy } from '@/auth/password'
import { getRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'
import { sql } from 'drizzle-orm'

export type AuthenticateResult =
  | { ok: true; accountId: string; role: 'agent' | 'admin' }
  | { ok: false }

export async function authenticate(
  email: string,
  password: string,
): Promise<AuthenticateResult> {
  const { db } = getRuntimeDb()
  const [row] = await db
    .select({
      id: accounts.id,
      passwordHash: accounts.passwordHash,
      role: accounts.role,
    })
    .from(accounts)
    .where(sql`lower(${accounts.email}) = ${email.trim().toLowerCase()}`)
    .limit(1)

  const matches = await verifyPasswordOrDummy(password, row?.passwordHash ?? null)
  if (!row || !matches) return { ok: false }
  return { ok: true, accountId: row.id, role: row.role }
}
