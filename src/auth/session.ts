import { createHmac, timingSafeEqual } from 'node:crypto'

export const SESSION_COOKIE = 'onrecord_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14

export type SessionPayload = {
  accountId: string
  role: 'agent' | 'admin'
  viewingAsAccountId?: string
  exp: number
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters')
  }
  return secret
}

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

function sign(encoded: string) {
  return createHmac('sha256', sessionSecret()).update(encoded).digest('base64url')
}

export function createSessionValue(
  accountId: string,
  role: 'agent' | 'admin',
  viewingAsAccountId?: string,
) {
  const encoded = encodePayload({
    accountId,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    ...(viewingAsAccountId ? { viewingAsAccountId } : {}),
  })
  return `${encoded}.${sign(encoded)}`
}

export function readSessionValue(value: string | undefined): SessionPayload | null {
  if (!value) return null
  const dot = value.indexOf('.')
  if (dot < 1) return null
  const encoded = value.slice(0, dot)
  const signature = value.slice(dot + 1)
  const expected = sign(encoded)
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload
    if (!payload.accountId || (payload.role !== 'agent' && payload.role !== 'admin')) {
      return null
    }
    if (payload.viewingAsAccountId && typeof payload.viewingAsAccountId !== 'string') {
      return null
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  }
}

export function safeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/app'
  return value
}
