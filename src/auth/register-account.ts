import { hashPassword } from '@/auth/password'
import { passwordMeetsRequirements } from '@/auth/password-rules'
import { getRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'
import { normalizeUsPhone } from '@/config/phone'
import { sql } from 'drizzle-orm'

export type RegisterInput = {
  name: string
  email: string
  password: string
  brokerage: string
  dre: string
  phone: string
}

export type RegisterResult =
  | { ok: true; accountId: string }
  | { ok: false; field: 'email' | 'password'; message: string }

/**
 * Stored the way Settings stores it: 10 bare digits. A number that is not a US number is kept as
 * typed rather than refused, so signup never rejects a number an agent could have entered before.
 */
export function signupPhone(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  return normalizeUsPhone(trimmed) ?? trimmed
}

export async function registerAccount(input: RegisterInput): Promise<RegisterResult> {
  if (!passwordMeetsRequirements(input.password)) {
    return {
      ok: false,
      field: 'password',
      message: 'Use at least 10 characters.',
    }
  }

  const email = input.email.trim().toLowerCase()
  const { db } = getRuntimeDb()
  const [existing] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(sql`lower(${accounts.email}) = ${email}`)
    .limit(1)

  if (existing) {
    return { ok: false, field: 'email', message: 'That email already has an account.' }
  }

  try {
    const [created] = await db
      .insert(accounts)
      .values({
        email,
        passwordHash: await hashPassword(input.password),
        name: input.name.trim(),
        brokerage: input.brokerage.trim() || null,
        dre: input.dre.trim() || null,
        phone: signupPhone(input.phone),
        role: 'agent',
      })
      .returning({ id: accounts.id })

    if (!created) {
      return { ok: false, field: 'email', message: 'That email already has an account.' }
    }
    return { ok: true, accountId: created.id }
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? error.code : null
    if (code === '23505') {
      return { ok: false, field: 'email', message: 'That email already has an account.' }
    }
    throw error
  }
}
