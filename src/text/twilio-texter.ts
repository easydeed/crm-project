import { TextSendError, type OutboundText, type Texter } from '@/text/texter'
import { publicOrigin } from '@/unsubscribe/links'

function required(name: string): string {
  const value = process.env[name]?.trim() ?? ''
  if (!value) throw new Error(`Texting is not configured: ${name} is empty`)
  return value
}

export const TWILIO_WEBHOOK_PATH = '/api/webhooks/twilio'

/**
 * Twilio's Messages API with fetch; no SDK. Twilio has no idempotency key, so the
 * caller claims the message in text_messages before this is called.
 */
export class TwilioTexter implements Texter {
  readonly billable = true

  async send(msg: OutboundText): Promise<{ providerId: string }> {
    const sid = required('TWILIO_ACCOUNT_SID')
    const token = required('TWILIO_AUTH_TOKEN')
    const body = new URLSearchParams({
      To: msg.to,
      From: required('TWILIO_FROM_NUMBER'),
      Body: msg.body,
      StatusCallback: `${publicOrigin()}${TWILIO_WEBHOOK_PATH}`,
    })
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      cache: 'no-store',
    })
    const json = (await response.json().catch(() => ({}))) as { sid?: string; code?: number; message?: string }
    if (!response.ok || !json.sid) {
      throw new TextSendError(`Twilio refused the text (${response.status}): ${json.message ?? 'no message'}`, json.code ?? null)
    }
    return { providerId: json.sid }
  }
}
