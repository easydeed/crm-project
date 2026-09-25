import { createHmac, timingSafeEqual } from 'node:crypto'

/** Stripe's default: an event signed more than five minutes ago is refused, so a captured body can't be replayed later. */
const TOLERANCE_SECONDS = 300

function hmac(secret: string, timestamp: string, payload: string) {
  return createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
}

/** The Stripe-Signature header for a body. Used by tests to play Stripe. */
export function signStripePayload(payload: string, secret: string, now = new Date()): string {
  const timestamp = String(Math.floor(now.getTime() / 1000))
  return `t=${timestamp},v1=${hmac(secret, timestamp, payload)}`
}

/** Checks the raw body against Stripe-Signature (t=…,v1=…). Any failure is false, never a throw. */
export function verifyStripeSignature(payload: string, header: string | null, secret: string, now = new Date()): boolean {
  if (!header || !secret) return false
  const parts = header.split(',').map((part) => part.trim().split('='))
  const timestamp = parts.find(([key]) => key === 't')?.[1] ?? ''
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value ?? '')
  if (!/^\d+$/.test(timestamp) || signatures.length === 0) return false
  if (Math.abs(now.getTime() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false
  const expected = Buffer.from(hmac(secret, timestamp, payload), 'utf8')
  return signatures.some((signature) => {
    const given = Buffer.from(signature, 'utf8')
    return given.length === expected.length && timingSafeEqual(given, expected)
  })
}
