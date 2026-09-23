import { ServerClient } from 'postmark'
import type { Mailer, OutboundMail } from '@/mail/types'

export class PostmarkMailer implements Mailer {
  constructor(private readonly token = process.env.POSTMARK_SERVER_TOKEN ?? '') {}

  async send(msg: OutboundMail): Promise<{ providerId: string }> {
    if (!this.token) throw new Error('POSTMARK_SERVER_TOKEN is not set')
    const client = new ServerClient(this.token)
    const result = await client.sendEmail({
      From: msg.from,
      To: msg.to,
      ReplyTo: msg.replyTo || undefined,
      Subject: msg.subject,
      HtmlBody: msg.html,
      TextBody: msg.text,
      MessageStream: msg.stream,
      Metadata: { idempotencyKey: msg.idempotencyKey },
      Headers: [{ Name: 'X-OnRecord-Idempotency-Key', Value: msg.idempotencyKey }],
    })
    return { providerId: result.MessageID }
  }
}
