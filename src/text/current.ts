import { demoBilling } from '@/billing/demo-checkout'
import { FakeTexter } from '@/text/fake-texter'
import type { Texter } from '@/text/texter'
import { TwilioTexter } from '@/text/twilio-texter'

let current: Texter = demoBilling() ? new FakeTexter() : new TwilioTexter()

export function getTexter(): Texter {
  return current
}

/** Tests install a FakeTexter here. Production keeps TwilioTexter. */
export function setTexter(next: Texter) {
  current = next
}
