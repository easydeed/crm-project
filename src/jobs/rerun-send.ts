import { and, eq, isNull } from 'drizzle-orm'
import { getAccountById } from '@/db/accounts'
import { getRuntimeDb } from '@/db/runtime'
import { accounts, adminActions, sendRecipients, sends } from '@/db/schema'
import { ADMIN_UNPAUSE } from '@/db/system-pause'
import { enqueue } from '@/jobs/enqueue'

export async function rerunSend(adminAccountId: string, sendId: string, now = new Date()) {
  const admin = await getAccountById(adminAccountId)
  if (!admin || admin.role !== 'admin') return { ok: false as const }
  const { db } = getRuntimeDb()
  const [send] = await db.select().from(sends).where(eq(sends.id, sendId)).limit(1)
  if (!send) return { ok: false as const }

  const pending = await db
    .select({ id: sendRecipients.id })
    .from(sendRecipients)
    .where(
      and(
        eq(sendRecipients.sendId, sendId),
        isNull(sendRecipients.sentAt),
        eq(sendRecipients.permanentFailure, false),
      ),
    )
  if (pending.length && (send.state === 'done' || send.state === 'skipped')) {
    await db.update(sends).set({ state: 'ready' }).where(eq(sends.id, sendId))
  }

  let queued = await enqueue('send', { sendId }, now)
  if (!queued.created) {
    queued = await enqueue('send', { sendId }, new Date(now.getTime() + 1))
  }
  await db.insert(adminActions).values({
    adminAccountId,
    targetAccountId: send.accountId,
    action: 'rerun_send',
    detail: { sendId },
  })
  return { ok: true as const, jobId: queued.id }
}

export async function adminUnpause(adminAccountId: string, targetAccountId: string) {
  const admin = await getAccountById(adminAccountId)
  const target = await getAccountById(targetAccountId)
  if (!admin || admin.role !== 'admin' || !target) return { ok: false as const }
  const { db } = getRuntimeDb()
  await db.update(accounts).set({ paused: false }).where(eq(accounts.id, targetAccountId))
  await db.insert(adminActions).values({
    adminAccountId,
    targetAccountId,
    action: ADMIN_UNPAUSE,
    detail: { actor: 'admin' },
  })
  return { ok: true as const }
}
