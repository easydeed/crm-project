import { createHash } from 'node:crypto'
import { and, eq, sql } from 'drizzle-orm'
import { openToken, sealToken } from '@/auth/signed-token'
import { hashPassword, passwordMeetsRequirements, PASSWORD_MIN_LENGTH } from '@/auth/password'
import { isLocalE2E } from '@/config/e2e'
import { getRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'

type ResetProof = { accountId: string; passwordVersion: string }
const versionOf = (hash: string) => createHash('sha256').update(hash).digest('hex')

/** Local demo inbox only. Public environments never disclose password-reset credentials. */
export async function requestDemoRecovery(email: string) {
  if (!isLocalE2E()) return null
  const { db } = getRuntimeDb()
  const [account] = await db.select({ id: accounts.id, hash: accounts.passwordHash }).from(accounts)
    .where(sql`lower(${accounts.email}) = ${email.trim().toLowerCase()}`).limit(1)
  if (!account) return null
  const token = sealToken('password-reset', { accountId: account.id, passwordVersion: versionOf(account.hash) }, Date.now() + 15 * 60_000)
  return `/reset-password?token=${encodeURIComponent(token)}`
}

export async function resetPassword(token: string, password: string) {
  if (!passwordMeetsRequirements(password)) return { ok: false, message: `Use at least ${PASSWORD_MIN_LENGTH} characters.` }
  const proof = openToken<ResetProof>(token, 'password-reset')
  if (!proof) return { ok: false, message: 'This reset link expired or was already used. Request a new one.' }
  const { db } = getRuntimeDb()
  const [account] = await db.select({ hash: accounts.passwordHash }).from(accounts).where(eq(accounts.id, proof.accountId)).limit(1)
  if (!account || versionOf(account.hash) !== proof.passwordVersion) return { ok: false, message: 'This reset link expired or was already used. Request a new one.' }
  const changed = await db.update(accounts).set({ passwordHash: await hashPassword(password), authVersion: sql`${accounts.authVersion} + 1` })
    .where(and(eq(accounts.id, proof.accountId), eq(accounts.passwordHash, account.hash))).returning({ id: accounts.id })
  return changed.length ? { ok: true } : { ok: false, message: 'This reset link was already used. Request a new one.' }
}
