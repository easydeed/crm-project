import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { normalizeUsPhone } from '@/config/phone'
import { getRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'
import { textMessages } from '@/db/schema-text'
import { stopTexting } from '@/text/text-facts'
import { PERMANENT_TEXT_CODES, STOPPED_CODE } from '@/text/texter'
import { verifyTwilioSignature } from '@/text/twilio-signature'

export type TwilioOutcome = 'bad_signature' | 'stop' | 'failure' | 'ignored'

const STOP_WORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'REVOKE', 'OPTOUT'])

/**
 * Twilio calls this for a reply (inbound message) and for delivery status. Only STOP
 * and hard failures matter; nothing is ever sent back. Twilio answers STOP itself.
 */
export async function handleTwilioWebhook(url: string, params: Record<string, string>, signature: string | null, now = new Date()): Promise<TwilioOutcome> {
  if (!verifyTwilioSignature(url, params, signature, process.env.TWILIO_AUTH_TOKEN?.trim() ?? '')) return 'bad_signature'
  const { db } = getRuntimeDb()

  if (params.MessageStatus) {
    const code = Number(params.ErrorCode)
    if (!['failed', 'undelivered'].includes(params.MessageStatus) || !PERMANENT_TEXT_CODES.has(code)) return 'ignored'
    const [sent] = await db
      .select({ id: textMessages.id, accountId: textMessages.accountId, kind: textMessages.kind, toPhone: textMessages.toPhone })
      .from(textMessages)
      .where(eq(textMessages.providerId, params.MessageSid ?? ''))
      .limit(1)
    if (!sent) return 'ignored'
    await db.update(textMessages).set({ error: `Twilio ${params.MessageStatus}: ${code}`, permanentFailure: true }).where(eq(textMessages.id, sent.id))
    if (sent.kind === 'call_list') await stopTexting(db, sent.accountId, sent.toPhone, code === STOPPED_CODE ? 'stop_received' : 'call_list', now)
    return 'failure'
  }

  const isStop = params.OptOutType === 'STOP' || STOP_WORDS.has((params.Body ?? '').trim().toUpperCase())
  const digits = normalizeUsPhone(params.From ?? '')
  if (!isStop || !digits) return 'ignored'
  const owners = await db
    .select({ id: accounts.id })
    .from(accounts)
    // Phones are stored as typed at signup; compare on the last ten digits.
    .where(and(sql`right(regexp_replace(${accounts.phone}, '[^0-9]', '', 'g'), 10) = ${digits}`, isNotNull(accounts.phoneVerifiedAt)))
  for (const owner of owners) await stopTexting(db, owner.id, params.From!, 'stop_received', now)
  return owners.length ? 'stop' : 'ignored'
}
