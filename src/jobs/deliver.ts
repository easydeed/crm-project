import { assertSendAllowed, type SendGuardContext } from '@/jobs/send-guard'
import type { Mailer, OutboundMail } from '@/mail/types'

const PERMANENT_POSTMARK_CODES = new Set([300, 406])

export function isPermanentDeliveryError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  if (/unsubscribed|suppressed/i.test(err.message)) return true
  const code = (err as { code?: number }).code
  return typeof code === 'number' && PERMANENT_POSTMARK_CODES.has(code)
}

/**
 * The only function that may call mailer.send. The guard runs first.
 * A new send path has to come through here or the source test fails.
 */
export async function deliverRecipient(
  mailer: Mailer,
  guard: SendGuardContext,
  msg: OutboundMail,
): Promise<{ providerId: string }> {
  assertSendAllowed(guard)
  return mailer.send(msg)
}
