import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { expect, test } from 'vitest'
import { GET } from '@/app/u/[token]/route'
import { listUnsubscribeHeaders } from '@/unsubscribe/links'
import { renderUnsubscribeHtml } from '@/unsubscribe/html'
import { readUnsubscribeToken, signUnsubscribeToken } from '@/unsubscribe/token'
import type { UnsubscribeView } from '@/unsubscribe/load'

function src(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8')
}

test('a token is stable, scoped, and a tampered token 404s', async () => {
  const contactId = randomUUID()
  const first = signUnsubscribeToken(contactId, 'monthly')
  const again = signUnsubscribeToken(contactId, 'monthly')
  expect(again).toBe(first)
  expect(signUnsubscribeToken(contactId, 'weekly')).not.toBe(first)
  expect(readUnsubscribeToken(first)).toEqual({ contactId, scope: 'monthly' })

  const flipped = first.slice(0, -1) + (first.endsWith('a') ? 'b' : 'a')
  expect(readUnsubscribeToken(flipped)).toBeNull()
  const response = await GET(new Request('http://localhost/u/bad'), {
    params: Promise.resolve({ token: flipped }),
  })
  expect(response.status).toBe(404)

  const other = signUnsubscribeToken(randomUUID(), 'monthly')
  expect(readUnsubscribeToken(other)?.contactId).not.toBe(contactId)
})

test('every message carries both unsubscribe headers', () => {
  const headers = listUnsubscribeHeaders(randomUUID(), 'monthly')
  const list = headers.find((header) => header.name === 'List-Unsubscribe')?.value ?? ''
  expect(list).toMatch(/^<mailto:[^>]+>, <https?:\/\/.+\/u\/.+>$/)
  expect(headers).toContainEqual({
    name: 'List-Unsubscribe-Post',
    value: 'List-Unsubscribe=One-Click',
  })
  expect(src('../mail/postmark-mailer.ts')).toContain('...msg.headers.map')
  expect(src('../jobs/send-job.ts')).toContain('listUnsubscribeHeaders')
  expect(src('../jobs/compose.ts')).toContain('applyUnsubscribeLinks')
})

function view(scopes: UnsubscribeView['scopes'], blocked = false, suppressed = false): UnsubscribeView {
  return {
    contactId: randomUUID(),
    scope: 'monthly',
    propertyAddress: '1142 Oakdale Ave, La Verne, 91750',
    addressRaw: '1142 Oakdale Ave, La Verne, CA 91750',
    agentName: 'OR014 Agent',
    scopes,
    blocked,
    suppressed,
    notice: null,
  }
}

test('the page shows the house and only the scopes that are still on', () => {
  const monthly = renderUnsubscribeHtml(
    view([{ scope: 'monthly', active: true }]),
    'token',
  )
  expect(monthly).toContain('1142 Oakdale Ave, La Verne, 91750')
  expect(monthly).toContain('Update my address')
  expect(monthly).toContain("Moved? Tell us where and we'll switch to your new home.")
  expect(monthly).toContain('Stop these emails')
  expect(monthly).not.toContain('weekly')
  expect(monthly).not.toMatch(/are you sure|miss out|before you go/i)

  const both = renderUnsubscribeHtml(
    view([
      { scope: 'monthly', active: true },
      { scope: 'weekly', active: true },
    ]),
    'token',
  )
  expect(both).toContain('Stop the weekly note')

  const stopped = renderUnsubscribeHtml(
    { ...view([{ scope: 'monthly', active: false }]), notice: 'These emails have stopped.' },
    'token',
  )
  expect(stopped).toContain('These emails have stopped.')
  expect(stopped).toContain('Actually, keep them coming')
  expect(stopped).not.toContain('>Stop these emails<')
})

test('a bounced address cannot sign back up from this page', () => {
  const html = renderUnsubscribeHtml(
    view([{ scope: 'monthly', active: false }], true),
    'token',
  )
  expect(html).toContain(
    'This address stopped accepting our email. Ask OR014 Agent to add a different one.',
  )
  expect(html).not.toContain('Update my address')
  expect(html).not.toContain('Actually, keep them coming')
  expect(src('../app/u/[token]/route.ts')).toContain("if (current.blocked && intent !== 'stop')")
  expect(src('../app/u/[token]/route.ts')).toContain("content-type': 'text/plain; charset=utf-8'")
})

test('once the address is suppressed, the page never offers to keep them coming', () => {
  const html = renderUnsubscribeHtml(
    { ...view([{ scope: 'monthly', active: false }], false, true), notice: 'These emails have stopped.' },
    'token',
  )
  expect(html).toContain('These emails have stopped.')
  expect(html).not.toContain('Actually, keep them coming')
  expect(src('../app/u/[token]/route.ts')).toContain('const allowed = !current.blocked && !current.suppressed')
})
