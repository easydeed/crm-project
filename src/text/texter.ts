/** One text to one phone. `to` is E.164. */
export type OutboundText = {
  to: string
  body: string
  idempotencyKey: string
}

/** Same shape as Mailer. `billable` lets withMetering record a provider_calls row per send. */
export interface Texter {
  readonly billable: boolean
  send(msg: OutboundText): Promise<{ providerId: string }>
}

/** A provider error with Twilio's numeric code, so a hard failure can be told from a blip. */
export class TextSendError extends Error {
  constructor(
    message: string,
    readonly code: number | null,
  ) {
    super(message)
  }
}

/** Codes that mean this number will not take our texts: unsubscribed, invalid, not a mobile, unreachable. */
export const PERMANENT_TEXT_CODES = new Set([21610, 21211, 21614, 30003, 30005, 30006])
export const STOPPED_CODE = 21610

export function isPermanentTextError(err: unknown): boolean {
  return err instanceof TextSendError && err.code !== null && PERMANENT_TEXT_CODES.has(err.code)
}
