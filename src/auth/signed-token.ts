import { createHmac, timingSafeEqual } from 'node:crypto'

function signature(payload: string) {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters')
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function sealToken(purpose: string, value: unknown, expiresAt: number): string {
  const payload = Buffer.from(JSON.stringify({ purpose, value, expiresAt })).toString('base64url')
  return `${payload}.${signature(payload)}`
}

export function openToken<T>(token: string, purpose: string, now = Date.now()): T | null {
  if (token.length > 100_000) return null
  const [payload, supplied, extra] = token.split('.')
  if (!payload || !supplied || extra) return null
  const expected = signature(payload)
  if (supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return null
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return parsed.purpose === purpose && Number.isFinite(parsed.expiresAt) && parsed.expiresAt > now ? parsed.value as T : null
  } catch {
    return null
  }
}
