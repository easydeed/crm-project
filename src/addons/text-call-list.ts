import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { AddonDefinition } from '@/addons/types'
import { usPhoneToE164 } from '@/config/phone'
import { getRuntimeDb } from '@/db/runtime'
import { accounts } from '@/db/schema'

export const TEXT_CALL_LIST_KEY = 'text_call_list'
export const VERIFY_FIRST = 'Verify your phone in Settings first.'

/** The agent's verified phone as E.164, or null. The only phone this add-on ever texts. */
export async function verifiedPhone(accountId: string): Promise<string | null> {
  const { db } = getRuntimeDb()
  const [row] = await db
    .select({ phone: accounts.phone, verifiedAt: accounts.phoneVerifiedAt })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1)
  return row?.verifiedAt ? usPhoneToE164(row.phone) : null
}

/** $2: this month's three names, texted to the agent's own verified phone. Config is that phone, set by the server. */
export const TEXT_CALL_LIST: AddonDefinition = {
  key: TEXT_CALL_LIST_KEY,
  title: 'Text me the call list',
  blurb: 'Your three names each month, texted to your own phone.',
  band: 'extras',
  requiresConfig: true,
  configSchema: z.object({ phone: z.string().regex(/^\+1\d{10}$/).describe('Your verified phone') }),
  configHref: '/app/settings#phone',
  async resolveConfig(accountId) {
    const phone = await verifiedPhone(accountId)
    return phone ? { ok: true, config: { phone } } : { ok: false, message: VERIFY_FIRST }
  },
}
