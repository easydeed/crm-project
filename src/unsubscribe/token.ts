import { createHmac, timingSafeEqual } from 'node:crypto'

export type UnsubscribeScope = 'monthly' | 'weekly'

export type UnsubscribeToken = {
  contactId: string
  scope: UnsubscribeScope
}

function secret() {
  const value = process.env.UNSUBSCRIBE_SECRET
  if (!value || value.length < 32) {
    throw new Error('UNSUBSCRIBE_SECRET must be set and at least 32 characters')
  }
  return value
}

function isScope(value: string): value is UnsubscribeScope {
  return value === 'monthly' || value === 'weekly'
}

/** Stable for a contact and scope. No expiry, so an old email still works. */
export function signUnsubscribeToken(contactId: string, scope: UnsubscribeScope): string {
  const payload = Buffer.from(`${contactId}.${scope}`, 'utf8').toString('base64url')
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function readUnsubscribeToken(token: string): UnsubscribeToken | null {
  const dot = token.indexOf('.')
  if (dot < 1) return null
  const payload = token.slice(0, dot)
  const signature = token.slice(dot + 1)
  let expected: string
  try {
    expected = createHmac('sha256', secret()).update(payload).digest('base64url')
  } catch {
    return null
  }
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null
  try {
    const decoded = Buffer.from(payload, 'base64url').toString('utf8')
    const split = decoded.lastIndexOf('.')
    if (split < 1) return null
    const contactId = decoded.slice(0, split)
    const scope = decoded.slice(split + 1)
    if (!isScope(scope) || !/^[0-9a-f-]{36}$/i.test(contactId)) return null
    return { contactId, scope }
  } catch {
    return null
  }
}
