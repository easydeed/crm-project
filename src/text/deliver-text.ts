import { withMetering } from '@/providers/metering'
import { getTexter } from '@/text/current'
import { assertTextAllowed, type TextGuardContext } from '@/text/text-guard'
import type { OutboundText } from '@/text/texter'

/**
 * The only function that may call texter.send. The guard runs first, and every send
 * is metered into provider_calls. A new text path has to come through here or the
 * source test fails.
 */
export async function deliverText(accountId: string, guard: TextGuardContext, msg: OutboundText): Promise<{ providerId: string }> {
  assertTextAllowed(guard)
  if (msg.to !== guard.to) throw new Error('Text blocked: message and guard name different phones')
  const texter = withMetering(getTexter(), 'text', { accountId })
  return texter.send(msg)
}
