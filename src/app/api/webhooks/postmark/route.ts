import { NextResponse } from 'next/server'
import { recordPostmarkEvent, webhookSecretOk } from '@/mail/postmark-webhook'

export async function POST(request: Request) {
  if (!webhookSecretOk(request)) {
    return new NextResponse(null, { status: 404 })
  }
  const body = await request.json().catch(() => null)
  await recordPostmarkEvent(body)
  return NextResponse.json({ ok: true })
}
