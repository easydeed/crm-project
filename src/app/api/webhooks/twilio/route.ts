import { NextResponse } from 'next/server'
import { handleTwilioWebhook } from '@/text/twilio-webhook'
import { TWILIO_WEBHOOK_PATH } from '@/text/twilio-texter'
import { publicOrigin } from '@/unsubscribe/links'

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null)
  const params: Record<string, string> = {}
  form?.forEach((value, key) => {
    if (typeof value === 'string') params[key] = value
  })
  const outcome = await handleTwilioWebhook(`${publicOrigin()}${TWILIO_WEBHOOK_PATH}`, params, request.headers.get('x-twilio-signature'))
  if (outcome === 'bad_signature') return new NextResponse(null, { status: 404 })
  // An empty TwiML response: we never reply to the agent.
  return new NextResponse('<Response></Response>', { status: 200, headers: { 'content-type': 'text/xml' } })
}
