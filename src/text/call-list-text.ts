import { eq } from 'drizzle-orm'
import { isAddonEnabled } from '@/addons/state'
import { TEXT_CALL_LIST_KEY, verifiedPhone } from '@/addons/text-call-list'
import { CALL_TAGS } from '@/app/app/call-tags'
import { loadCallList } from '@/app/app/call-list-data'
import { getRuntimeDb } from '@/db/runtime'
import { textMessages } from '@/db/schema-text'
import type { SignalKind } from '@/signals/types'
import { deliverText } from '@/text/deliver-text'
import { billingActive, stopTexting } from '@/text/text-facts'
import { isPermanentTextError, STOPPED_CODE, TextSendError } from '@/text/texter'
import { publicOrigin } from '@/unsubscribe/links'

export const MAX_TEXT_LENGTH = 320
const MAX_NAME = 40

/** The text itself. No names, no text: never "you have nothing to do". */
export function callListText(entries: { name: string; kind: SignalKind }[], appUrl: string): string | null {
  if (entries.length === 0) return null
  const line = (name: string, kind: SignalKind) => `${name}: ${CALL_TAGS[kind].label.toLowerCase()}.`
  const build = (limit: number) =>
    [`onrecord — ${entries.length} to call this month.`, ...entries.map((e) => line(e.name.length > limit ? `${e.name.slice(0, limit - 1)}…` : e.name, e.kind)), `${appUrl}/app`].join('\n')
  let text = build(Number.MAX_SAFE_INTEGER)
  for (let limit = MAX_NAME; text.length > MAX_TEXT_LENGTH && limit > 8; limit -= 4) text = build(limit)
  return text
}

export type CallListTextOutcome = 'off' | 'empty' | 'already' | 'sent' | 'failed'

/**
 * Texts this period's names to the agent's verified phone, once. Never throws: the list
 * on the dashboard is the source of truth and the text is a convenience.
 */
export async function textCallList(accountId: string, period: string, asOf: Date, now = new Date()): Promise<CallListTextOutcome> {
  try {
    if (!(await isAddonEnabled(accountId, TEXT_CALL_LIST_KEY))) return 'off'
    const list = await loadCallList(accountId, asOf)
    const body = list.kind === 'list' ? callListText(list.entries, publicOrigin()) : null
    if (!body) return 'empty'
    const phone = await verifiedPhone(accountId)
    const { db } = getRuntimeDb()
    const [claimed] = await db
      .insert(textMessages)
      .values({ accountId, kind: 'call_list', period, toPhone: phone ?? 'unverified', createdAt: now })
      .onConflictDoNothing()
      .returning({ id: textMessages.id })
    try {
      const { providerId } = await deliverText(
        accountId,
        { purpose: 'call_list', to: phone ?? '', verifiedPhone: phone, billingActive: await billingActive(db, accountId, now), addonEnabled: true },
        { to: phone ?? '', body, idempotencyKey: `${accountId}:${period}` },
      )
      await db.update(textMessages).set({ providerId }).where(eq(textMessages.id, claimed?.id ?? ''))
      return 'sent'
    } catch (err) {
      const permanent = isPermanentTextError(err)
      await db.update(textMessages).set({ error: err instanceof Error ? err.message : String(err), permanentFailure: permanent }).where(eq(textMessages.id, claimed?.id ?? ''))
      if (permanent && phone) {
        await stopTexting(db, accountId, phone, err instanceof TextSendError && err.code === STOPPED_CODE ? 'stop_received' : 'call_list', now)
      }
      return 'failed'
    }
  } catch (err) {
    console.error(`[text] call list text for ${accountId} failed`, err)
    return 'failed'
  }
}
