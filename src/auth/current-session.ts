import { eq } from 'drizzle-orm'
import { getRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'
import { cookies } from 'next/headers'
import { readSessionValue, SESSION_COOKIE } from '@/auth/session'

export async function readRequestSession() {
  const jar = await cookies()
  const session = readSessionValue(jar.get(SESSION_COOKIE)?.value)
  if (!session) return null
  const [account] = await getRuntimeDb().db.select({ version: accounts.authVersion, role: accounts.role }).from(accounts).where(eq(accounts.id, session.accountId)).limit(1)
  return account && account.role === session.role && account.version === (session.authVersion ?? 0) ? session : null
}
