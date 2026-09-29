/**
 * The one support address. It must exist before launch (docs/GO_LIVE.md): it is the only way
 * back for an agent whose sending was paused automatically, and a bounce there reads as ignored.
 */
export const SUPPORT_EMAIL = 'help@onrecord.com'

/** A mailto with the subject prefilled, so the message names the account without the agent looking it up. */
export function supportMailto(subject: string) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
}

export function pausedAccountMailto(accountId: string) {
  return supportMailto(`Paused account - ${accountId}`)
}
