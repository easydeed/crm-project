export type SendGuardContext = {
  recipientEmail: string
  unsubscribed: boolean
  /** From the suppressions table, by address. Required so no caller can leave it out. */
  suppressed: boolean
  accountPaused: boolean
  /** From billingAllowsSending: an active subscription, not past its cancel date. Required so no caller can leave it out. */
  billingActive: boolean
}

function emailDomain(email: string): string {
  const at = email.lastIndexOf('@')
  if (at < 0) return ''
  return email.slice(at + 1).trim().toLowerCase()
}

function isProductionEnv(): boolean {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === 'production'
  return process.env.NODE_ENV === 'production'
}

function allowlistAllows(domain: string): boolean {
  const raw = process.env.SEND_ALLOWLIST?.trim() ?? ''
  if (!raw) return false
  if (raw === '*') return isProductionEnv()
  const allowed = raw.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean)
  return allowed.includes(domain)
}

/**
 * Hard block before any real send. Callers supply unsubscribed / paused;
 * OR-014 wires the product flags. accounts.paused and
 * contact_subscriptions.unsubscribed_at already exist when callers load them.
 */
export function assertSendAllowed(ctx: SendGuardContext): void {
  if (process.env.SEND_ENABLED !== 'true') {
    throw new Error('Send blocked: SEND_ENABLED is not true')
  }
  const domain = emailDomain(ctx.recipientEmail)
  if (!domain || !allowlistAllows(domain)) {
    throw new Error('Send blocked: recipient domain is not allowlisted')
  }
  if (ctx.unsubscribed) {
    throw new Error('Send blocked: contact is unsubscribed')
  }
  if (ctx.suppressed) {
    throw new Error('Send blocked: address is suppressed')
  }
  if (ctx.accountPaused) {
    throw new Error('Send blocked: account is paused')
  }
}
