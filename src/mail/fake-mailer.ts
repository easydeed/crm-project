import type { Mailer, OutboundMail } from '@/mail/types'

/** Records every send and delivers nothing. Tests use this. Production does not. */
export class FakeMailer implements Mailer {
  readonly calls: OutboundMail[] = []
  failFor: (msg: OutboundMail) => boolean = () => false

  async send(msg: OutboundMail): Promise<{ providerId: string }> {
    this.calls.push(msg)
    if (this.failFor(msg)) throw new Error(`Mailbox rejected ${msg.to}`)
    return { providerId: `fake-${this.calls.length}` }
  }
}
