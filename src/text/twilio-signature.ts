import { createHmac, timingSafeEqual } from 'node:crypto'

/** X-Twilio-Signature: base64 HMAC-SHA1 of the full URL followed by each POST param, sorted, name then value. */
export function twilioSignature(url: string, params: Record<string, string>, authToken: string): string {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url)
  return createHmac('sha1', authToken).update(data, 'utf8').digest('base64')
}

export function verifyTwilioSignature(url: string, params: Record<string, string>, header: string | null, authToken: string): boolean {
  if (!header || !authToken) return false
  const expected = Buffer.from(twilioSignature(url, params, authToken))
  const given = Buffer.from(header)
  return given.length === expected.length && timingSafeEqual(given, expected)
}
