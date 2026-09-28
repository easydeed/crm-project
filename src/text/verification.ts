import { createHash, randomInt } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { isAddonEnabled, switchAddonOff } from '@/addons/state'
import { TEXT_CALL_LIST_KEY } from '@/addons/text-call-list'
import { usPhoneToE164 } from '@/config/phone'
import { getRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'
import { phoneVerifications, textMessages } from '@/db/schema-text'
import { deliverText } from '@/text/deliver-text'
import { MAX_CODES_PER_HOUR } from '@/text/text-guard'
import { billingActive, codesSentSince } from '@/text/text-facts'

export type VerifyResult = { ok: true } | { ok: false; message: string }

const CODE_MINUTES = 10
export const MAX_ATTEMPTS = 5

function hashCode(accountId: string, code: string) {
  return createHash('sha256').update(`${accountId}:${code}`).digest('hex')
}

async function accountPhone(accountId: string) {
  const { db } = getRuntimeDb()
  const [row] = await db.select({ phone: accounts.phone }).from(accounts).where(eq(accounts.id, accountId)).limit(1)
  return row?.phone ?? null
}

/** Texts a six-digit code to the phone saved in Settings. At most three an hour. */
export async function requestPhoneCode(accountId: string, now = new Date(), code = String(randomInt(0, 1_000_000)).padStart(6, '0')): Promise<VerifyResult> {
  const { db } = getRuntimeDb()
  const phone = await accountPhone(accountId)
  if (!phone) return { ok: false, message: 'Add your phone above first.' }
  const sentLastHour = await codesSentSince(db, accountId, new Date(now.getTime() - 3_600_000))
  if (sentLastHour >= MAX_CODES_PER_HOUR) return { ok: false, message: 'You asked for three codes this hour. Try again later.' }

  const fields = { phone, codeHash: hashCode(accountId, code), expiresAt: new Date(now.getTime() + CODE_MINUTES * 60_000), attempts: 0, createdAt: now }
  await db.insert(phoneVerifications).values({ accountId, ...fields }).onConflictDoUpdate({ target: phoneVerifications.accountId, set: fields })
  const [issued] = await db.select({ phone: phoneVerifications.phone }).from(phoneVerifications).where(eq(phoneVerifications.accountId, accountId))

  const to = usPhoneToE164(phone)
  if (!to) return { ok: false, message: 'Use a US mobile number, like 909-555-0147.' }
  const [row] = await db.insert(textMessages).values({ accountId, kind: 'verify', toPhone: to, createdAt: now }).returning({ id: textMessages.id })
  try {
    const { providerId } = await deliverText(
      accountId,
      { purpose: 'verify', to, accountPhone: to, codePhone: issued ? usPhoneToE164(issued.phone) : null, billingActive: await billingActive(db, accountId, now), codesSentLastHour: sentLastHour },
      { to, body: `onrecord code: ${code}. It expires in ${CODE_MINUTES} minutes.`, idempotencyKey: `verify:${row!.id}` },
    )
    await db.update(textMessages).set({ providerId }).where(eq(textMessages.id, row!.id))
    return { ok: true }
  } catch (err) {
    await db.update(textMessages).set({ error: err instanceof Error ? err.message : String(err) }).where(eq(textMessages.id, row!.id))
    return { ok: false, message: 'We could not send the code. Check the number and try again.' }
  }
}

/** Confirms the code. It must match, be fresh, and be for the phone still saved in Settings. */
export async function confirmPhoneCode(accountId: string, code: string, now = new Date()): Promise<VerifyResult> {
  const { db } = getRuntimeDb()
  const [open] = await db.select().from(phoneVerifications).where(eq(phoneVerifications.accountId, accountId)).limit(1)
  if (!open) return { ok: false, message: 'Send a code first.' }
  if (open.expiresAt <= now) return { ok: false, message: 'That code expired. Send a new one.' }
  if (open.attempts >= MAX_ATTEMPTS) return { ok: false, message: 'Too many tries. Send a new code.' }
  if (usPhoneToE164(await accountPhone(accountId)) !== usPhoneToE164(open.phone)) {
    return { ok: false, message: 'Your phone changed since we sent the code. Send a new one.' }
  }
  if (hashCode(accountId, code.trim()) !== open.codeHash) {
    await db.update(phoneVerifications).set({ attempts: open.attempts + 1 }).where(eq(phoneVerifications.accountId, accountId))
    return { ok: false, message: 'That code does not match.' }
  }
  await db.update(accounts).set({ phoneVerifiedAt: now }).where(eq(accounts.id, accountId))
  await db.delete(phoneVerifications).where(eq(phoneVerifications.accountId, accountId))
  return { ok: true }
}

export const PHONE_CHANGED_ADDON_OFF = 'Your phone changed, so we turned off Text me the call list. Verify the new number to turn it back on.'

/** A new phone is unverified. Any open code dies with the old number, and the text add-on goes off. */
export async function onPhoneChanged(accountId: string): Promise<{ addonTurnedOff: boolean }> {
  const { db } = getRuntimeDb()
  await db.update(accounts).set({ phoneVerifiedAt: null }).where(eq(accounts.id, accountId))
  await db.delete(phoneVerifications).where(eq(phoneVerifications.accountId, accountId))
  if (!(await isAddonEnabled(accountId, TEXT_CALL_LIST_KEY))) return { addonTurnedOff: false }
  await switchAddonOff(accountId, TEXT_CALL_LIST_KEY)
  return { addonTurnedOff: true }
}
