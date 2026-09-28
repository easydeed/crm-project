import { randomUUID } from 'node:crypto'
import { TextSendError, type OutboundText, type Texter } from '@/text/texter'

/** Records every text and sends nothing. Tests always use this. */
export class FakeTexter implements Texter {
  readonly calls: OutboundText[] = []
  failWith: ((msg: OutboundText) => TextSendError | null) = () => null

  constructor(readonly billable = false) {}

  async send(msg: OutboundText): Promise<{ providerId: string }> {
    this.calls.push(msg)
    const failure = this.failWith(msg)
    if (failure) throw failure
    // Unique across fakes, like a real Twilio SID.
    return { providerId: `SMfake${this.calls.length}-${randomUUID()}` }
  }
}
