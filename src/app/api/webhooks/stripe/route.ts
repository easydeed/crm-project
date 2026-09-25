import { NextResponse } from 'next/server'
import { handleStripeWebhook } from '@/billing/webhook'

export async function POST(request: Request) {
  const body = await request.text()
  const outcome = await handleStripeWebhook(body, request.headers.get('stripe-signature'))
  if (outcome === 'bad_signature') {
    return new NextResponse(null, { status: 404 })
  }
  return NextResponse.json({ ok: true, outcome })
}
