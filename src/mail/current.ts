import { PostmarkMailer } from '@/mail/postmark-mailer'
import type { Mailer } from '@/mail/types'

let current: Mailer = new PostmarkMailer()

export function getMailer(): Mailer {
  return current
}

/** Tests install a FakeMailer here. Production keeps PostmarkMailer. */
export function setMailer(next: Mailer) {
  current = next
}
