import type { Texter } from '@/text/texter'
import { TwilioTexter } from '@/text/twilio-texter'

let current: Texter = new TwilioTexter()

export function getTexter(): Texter {
  return current
}

/** Tests install a FakeTexter here. Production keeps TwilioTexter. */
export function setTexter(next: Texter) {
  current = next
}
