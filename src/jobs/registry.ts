/**
 * Handlers must be safe to run twice. Check state before acting; never
 * assume this is the first attempt. compose and send are idempotent.
 * refresh_parcels and refresh_mls still only log.
 * build_call_lists writes this month's three names and is safe to run twice.
 * The send handler calls deliverRecipient, which calls assertSendAllowed
 * before any mailer.send.
 */
import { buildCallLists } from '@/jobs/build-call-lists'
import { composeSend } from '@/jobs/compose'
import { sendMail } from '@/jobs/send-job'
import type { JobHandler, JobKind } from '@/jobs/types'
import { JOB_KINDS } from '@/jobs/types'

function stub(kind: JobKind): JobHandler {
  return async (payload, ctx) => {
    console.info(`[job:${kind}] attempt=${ctx.attempt} job=${ctx.jobId}`, payload)
  }
}

export const handlers: Record<JobKind, JobHandler> = {
  refresh_parcels: stub('refresh_parcels'),
  refresh_mls: stub('refresh_mls'),
  compose: composeSend,
  send: sendMail,
  build_call_lists: buildCallLists,
}

export function getHandler(kind: string): JobHandler | undefined {
  if ((JOB_KINDS as readonly string[]).includes(kind)) {
    return handlers[kind as JobKind]
  }
  return undefined
}
