import { NextResponse } from 'next/server'
import { addressNotice, keepScope, stopScope, updateHomeownerAddress } from '@/unsubscribe/act'
import { loadUnsubscribeView } from '@/unsubscribe/load'
import { renderUnsubscribeHtml } from '@/unsubscribe/html'
import { readUnsubscribeToken } from '@/unsubscribe/token'

async function page(token: string, notice: string | null) {
  const view = await loadUnsubscribeView(token)
  if (!view) return new NextResponse(null, { status: 404 })
  const html = renderUnsubscribeHtml({ ...view, notice }, token)
  return new NextResponse(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params
  return page(token, null)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params
  const parsed = readUnsubscribeToken(token)
  if (!parsed) return new NextResponse(null, { status: 404 })

  let intent = 'stop'
  let address = ''
  let fromForm = false
  try {
    const form = await request.formData()
    const value = form.get('intent')
    if (value === 'update' || value === 'keep' || value === 'stop') {
      intent = value
      fromForm = true
    }
    const raw = form.get('address')
    if (typeof raw === 'string') address = raw
  } catch {
    intent = 'stop'
  }

  const current = await loadUnsubscribeView(token)
  if (!current) return new NextResponse(null, { status: 404 })

  if (current.blocked && intent !== 'stop') {
    return page(token, null)
  }

  if (intent === 'update') {
    const result = await updateHomeownerAddress(parsed.contactId, address)
    return page(token, addressNotice(result))
  }

  if (intent === 'keep') {
    const allowed = !current.blocked && !current.suppressed
    if (allowed) await keepScope(parsed.contactId, parsed.scope)
    return page(token, allowed ? 'These emails will keep coming.' : null)
  }

  await stopScope(parsed.contactId, parsed.scope, fromForm ? 'unsubscribe_page' : 'one_click')
  if (!fromForm) {
    return new NextResponse('Unsubscribed', {
      status: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }
  return page(token, 'These emails have stopped.')
}
