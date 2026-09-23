export type MailStream = 'monthly' | 'weekly'

export type OutboundMail = {
  to: string
  from: string
  replyTo: string
  subject: string
  html: string
  text: string
  stream: MailStream
  idempotencyKey: string
  headers: { name: string; value: string }[]
}

export interface Mailer {
  send(msg: OutboundMail): Promise<{ providerId: string }>
}

export function sendIdempotencyKey(sendId: string, contactId: string) {
  return `${sendId}:${contactId}`
}

export function monthlyFromAddress(senderName: string | null): string {
  const email = process.env.MAIL_FROM_MONTHLY?.trim() ?? ''
  if (!email) throw new Error('MAIL_FROM_MONTHLY is not set')
  const name = senderName?.trim()
  if (!name) return email
  return `${name} <${email}>`
}
