/**
 * Hard block before any text. The destination must be the agent's own phone: the
 * verified one for the call list, and for a verification code the one they saved in
 * Settings, unchanged since the code was issued. Nothing else can be texted.
 */
export type TextGuardContext =
  | {
      purpose: 'call_list'
      to: string
      /** accounts.phone when phone_verified_at is set, else null. E.164. */
      verifiedPhone: string | null
      billingActive: boolean
      addonEnabled: boolean
    }
  | {
      purpose: 'verify'
      to: string
      /** accounts.phone as saved in Settings. E.164. */
      accountPhone: string | null
      /** The phone the open code was issued for. E.164. */
      codePhone: string | null
      billingActive: boolean
      codesSentLastHour: number
    }

export const MAX_CODES_PER_HOUR = 3

export function assertTextAllowed(ctx: TextGuardContext): void {
  if (process.env.TEXTING_ENABLED !== 'true') {
    throw new Error('Text blocked: TEXTING_ENABLED is not true')
  }
  if (!ctx.billingActive) {
    throw new Error('Text blocked: account has no active subscription')
  }
  if (ctx.purpose === 'call_list') {
    if (!ctx.verifiedPhone) {
      throw new Error("Text blocked: destination is not the account's verified phone")
    }
    if (!ctx.addonEnabled) {
      throw new Error('Text blocked: the call list text add-on is off')
    }
    return
  }
  if (!ctx.accountPhone || ctx.to !== ctx.accountPhone) {
    throw new Error("Text blocked: destination is not the account's own phone")
  }
  if (ctx.codePhone !== ctx.accountPhone) {
    throw new Error('Text blocked: the phone changed since the code was issued')
  }
  if (ctx.codesSentLastHour >= MAX_CODES_PER_HOUR) {
    throw new Error('Text blocked: too many codes this hour')
  }
}
