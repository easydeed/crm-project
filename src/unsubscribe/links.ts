import { signUnsubscribeToken, type UnsubscribeScope } from '@/unsubscribe/token'

export function publicOrigin() {
  const configured = process.env.APP_ORIGIN?.trim()
  if (configured) return configured.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export function unsubscribeUrl(contactId: string, scope: UnsubscribeScope) {
  return `${publicOrigin()}/u/${signUnsubscribeToken(contactId, scope)}`
}

export function unsubscribeMailto(token: string) {
  const from = process.env.MAIL_FROM_MONTHLY?.trim() ?? ''
  const match = from.match(/<([^>]+)>/)
  const email = (match?.[1] ?? from).trim() || 'unsubscribe@localhost'
  return `mailto:${email}?subject=${encodeURIComponent(token)}`
}

export function listUnsubscribeHeaders(contactId: string, scope: UnsubscribeScope) {
  const token = signUnsubscribeToken(contactId, scope)
  const httpsUrl = `${publicOrigin()}/u/${token}`
  return [
    {
      name: 'List-Unsubscribe',
      value: `<${unsubscribeMailto(token)}>, <${httpsUrl}>`,
    },
    { name: 'List-Unsubscribe-Post', value: 'List-Unsubscribe=One-Click' },
  ]
}

export function applyUnsubscribeLinks(html: string, text: string, url: string) {
  return {
    html: html
      .replaceAll('href="#update-address"', `href="${url}"`)
      .replaceAll('href="#unsubscribe"', `href="${url}"`),
    text: `${text}\n${url}`,
  }
}
